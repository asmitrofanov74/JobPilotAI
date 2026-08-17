import '../graphql/graphql_service.dart';

class AuthUser {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? subscriptionTier;

  const AuthUser({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.subscriptionTier,
  });

  String get displayName {
    if (firstName != null && lastName != null) return '$firstName $lastName';
    if (firstName != null) return firstName!;
    return email;
  }

  AuthUser copyWith({String? firstName, String? lastName}) {
    return AuthUser(
      id: id,
      email: email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      subscriptionTier: subscriptionTier,
    );
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final subscription = json['subscription'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      subscriptionTier: subscription?['tier'] as String?,
    );
  }
}

class AuthRepository {
  static const String loginDocument = r'''
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        accessToken
        refreshToken
        user {
          id
          email
          firstName
          lastName
          subscription {
            tier
            currentPeriodEnd
          }
        }
      }
    }
  ''';

  static const String meDocument = r'''
    query Me {
      me {
        id
        email
        firstName
        lastName
        subscription {
          tier
          currentPeriodEnd
        }
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final result = await _service.mutate(
      document: loginDocument,
      variables: {'input': {'email': email, 'password': password}},
    );

    if (result.hasException) {
      throw AuthException(result.exception.toString());
    }

    final data = result.data?['login'] as Map<String, dynamic>?;
    if (data == null) throw const AuthException('Login failed');

    await _service.setTokens(
      AuthTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      ),
    );
    return AuthUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<AuthUser> fetchMe() async {
    final result = await _service.request(
      document: meDocument,
    );

    if (result.hasException) {
      throw AuthException(result.exception.toString());
    }

    final data = result.data?['me'] as Map<String, dynamic>?;
    if (data == null) throw const AuthException('Could not load user');
    return AuthUser.fromJson(data);
  }

  Future<void> logout() => _service.clearTokens();
}

class AuthException implements Exception {
  final String message;
  const AuthException(this.message);

  @override
  String toString() => message;
}
