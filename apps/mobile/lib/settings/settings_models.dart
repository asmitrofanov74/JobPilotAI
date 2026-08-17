class UserProfile {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? title;
  final String? targetRole;
  final String? experienceLevel;
  final String? targetLocations;
  final bool isActive;
  final String? subscriptionTier;
  final String? currentPeriodEnd;
  final DateTime createdAt;

  UserProfile({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.title,
    this.targetRole,
    this.experienceLevel,
    this.targetLocations,
    required this.isActive,
    this.subscriptionTier,
    this.currentPeriodEnd,
    required this.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final subscription = json['subscription'] as Map<String, dynamic>?;
    return UserProfile(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      title: json['title'] as String?,
      targetRole: json['targetRole'] as String?,
      experienceLevel: json['experienceLevel'] as String?,
      targetLocations: json['targetLocations'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      subscriptionTier: subscription?['tier'] as String?,
      currentPeriodEnd: subscription?['currentPeriodEnd'] as String?,
      createdAt: _parseDate(json['createdAt']),
    );
  }

  static DateTime _parseDate(dynamic value) {
    if (value is String) {
      return DateTime.tryParse(value)?.toLocal() ??
          DateTime.fromMillisecondsSinceEpoch(0);
    }
    return DateTime.fromMillisecondsSinceEpoch(0);
  }
}

const experienceLevels = [
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'EXECUTIVE',
];
