import '../graphql/graphql_service.dart';
import 'settings_models.dart';

class SettingsRepository {
  static const String meDocument = r'''
    query Me {
      me {
        id
        email
        firstName
        lastName
        title
        targetRole
        experienceLevel
        targetLocations
        isActive
        subscription {
          tier
          currentPeriodEnd
        }
        createdAt
      }
    }
  ''';

  static const String updateProfileDocument = r'''
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        id
        firstName
        lastName
        title
        targetRole
        experienceLevel
        targetLocations
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<UserProfile> me() async {
    final result = await _service.request(document: meDocument);
    if (result.hasException) throw result.exception!;
    final data = result.data?['me'];
    if (data is! Map) throw Exception('Could not load profile');
    return UserProfile.fromJson(data.cast<String, dynamic>());
  }

  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? title,
    String? targetRole,
    String? experienceLevel,
    String? targetLocations,
  }) async {
    final result = await _service.mutate(
      document: updateProfileDocument,
      variables: {
        'input': {
          if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
          if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
          if (title != null && title.isNotEmpty) 'title': title,
          if (targetRole != null && targetRole.isNotEmpty)
            'targetRole': targetRole,
          if (experienceLevel != null && experienceLevel.isNotEmpty)
            'experienceLevel': experienceLevel,
          if (targetLocations != null && targetLocations.isNotEmpty)
            'targetLocations': targetLocations,
        },
      },
    );
    if (result.hasException) throw result.exception!;
  }
}
