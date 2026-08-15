import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:graphql/client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000',
  );

  static String get graphqlUrl => '$apiBaseUrl/graphql';
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;

  const AuthTokens({required this.accessToken, required this.refreshToken});
}

class GraphqlService {
  GraphqlService._();

  static final GraphqlService instance = GraphqlService._();

  static const String _accessKey = 'auth.accessToken';
  static const String _refreshKey = 'auth.refreshToken';

  static const Duration _requestTimeout = Duration(seconds: 300);

  AuthTokens? _tokens;
  GraphQLClient? _client;
  bool _isRefreshing = false;
  final List<void Function()> _pendingRefreshes = [];

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final access = prefs.getString(_accessKey);
    final refresh = prefs.getString(_refreshKey);
    if (access != null && refresh != null) {
      _tokens = AuthTokens(accessToken: access, refreshToken: refresh);
    }
  }

  bool get isAuthenticated => _tokens != null;

  AuthTokens? get tokens => _tokens;

  GraphQLClient get client {
    _client ??= _createClient(_tokens?.accessToken);
    return _client!;
  }

  GraphQLClient _createClient(String? accessToken) {
    final httpLink = HttpLink(
      ApiConfig.graphqlUrl,
      defaultHeaders: {
        if (accessToken != null) 'Authorization': 'Bearer $accessToken',
      },
    );
    return GraphQLClient(
      link: httpLink,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }

  Future<void> setTokens(AuthTokens tokens) async {
    _tokens = tokens;
    _client = _createClient(tokens.accessToken);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessKey, tokens.accessToken);
    await prefs.setString(_refreshKey, tokens.refreshToken);
  }

  Future<void> clearTokens() async {
    _tokens = null;
    _client = _createClient(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessKey);
    await prefs.remove(_refreshKey);
  }

  Future<QueryResult<Map<String, dynamic>>> request({
    required String document,
    Map<String, dynamic>? variables,
  }) async {
    var result = await client.query<Map<String, dynamic>>(
      QueryOptions<Map<String, dynamic>>(
        document: gql(document),
        variables: variables ?? const {},
        fetchPolicy: FetchPolicy.noCache,
        queryRequestTimeout: _requestTimeout,
      ),
    );

    if (_isAuthError(result) && !_isLoginMutation(document)) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        result = await client.query<Map<String, dynamic>>(
          QueryOptions<Map<String, dynamic>>(
            document: gql(document),
            variables: variables ?? const {},
            fetchPolicy: FetchPolicy.noCache,
            queryRequestTimeout: _requestTimeout,
          ),
        );
      }
    }

    return result;
  }

  Future<QueryResult<Map<String, dynamic>>> mutate({
    required String document,
    Map<String, dynamic>? variables,
  }) async {
    var result = await client.mutate<Map<String, dynamic>>(
      MutationOptions<Map<String, dynamic>>(
        document: gql(document),
        variables: variables ?? const {},
        fetchPolicy: FetchPolicy.noCache,
        queryRequestTimeout: _requestTimeout,
      ),
    );

    if (_isAuthError(result) && !_isLoginMutation(document)) {
      final refreshed = await _tryRefresh();
      if (refreshed) {
        result = await client.mutate<Map<String, dynamic>>(
          MutationOptions<Map<String, dynamic>>(
            document: gql(document),
            variables: variables ?? const {},
            fetchPolicy: FetchPolicy.noCache,
            queryRequestTimeout: _requestTimeout,
          ),
        );
      }
    }

    return result;
  }

  static const String refreshDocument = r'''
    mutation RefreshToken($token: String!) {
      refreshToken(token: $token) {
        accessToken
        refreshToken
      }
    }
  ''';

  Future<bool> _tryRefresh() async {
    final refreshToken = _tokens?.refreshToken;
    if (refreshToken == null) return false;

    if (_isRefreshing) {
      return Future<bool>.delayed(Duration.zero, () async {
        final completer = Completer<void>();
        _pendingRefreshes.add(completer.complete);
        await completer.future;
        return _tokens != null;
      });
    }

    _isRefreshing = true;
    try {
      final tempClient = _createClient(null);
      final result = await tempClient.mutate<Map<String, dynamic>>(
        MutationOptions<Map<String, dynamic>>(
          document: gql(refreshDocument),
          variables: {'token': refreshToken},
          queryRequestTimeout: _requestTimeout,
        ),
      );
      final data = result.data?['refreshToken'] as Map<String, dynamic>?;
      if (data != null) {
        await setTokens(
          AuthTokens(
            accessToken: data['accessToken'] as String,
            refreshToken: data['refreshToken'] as String,
          ),
        );
        _flushPending();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Token refresh failed: $e');
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  void _flushPending() {
    for (final callback in _pendingRefreshes) {
      callback();
    }
    _pendingRefreshes.clear();
  }

  bool _isAuthError(QueryResult<Map<String, dynamic>> result) {    if (result.hasException) {
      final message = result.exception.toString();
      if (message.contains('UNAUTHENTICATED') ||
          message.contains('authentication required') ||
          message.toLowerCase().contains('unauthorized')) {
        return true;
      }
    }
    return false;
  }

  bool _isLoginMutation(String document) {
    return RegExp(r'mutation\s+Login\b', caseSensitive: false)
        .hasMatch(document);
  }
}
