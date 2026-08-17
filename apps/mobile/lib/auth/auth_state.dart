import 'package:flutter/foundation.dart';

import '../graphql/graphql_service.dart';
import 'auth_repository.dart';

class AuthState extends ChangeNotifier {
  final AuthRepository _repository = AuthRepository();
  final GraphqlService _service = GraphqlService.instance;

  AuthStatus status = AuthStatus.checking;
  AuthUser? user;
  String? error;

  Future<void> init() async {
    await _service.init();
    if (!_service.isAuthenticated) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      user = await _repository.fetchMe();
      status = AuthStatus.authenticated;
    } catch (e) {
      await _service.clearTokens();
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    error = null;
    notifyListeners();
    try {
      user = await _repository.login(email: email, password: password);
      status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  void updateUser(AuthUser updated) {
    user = updated;
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.logout();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}

enum AuthStatus { checking, unauthenticated, authenticated }
