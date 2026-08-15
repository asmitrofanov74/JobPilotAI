import '../graphql/graphql_service.dart';
import 'french_models.dart';

class FrenchScenario {
  final String value;
  final String label;
  final String description;

  const FrenchScenario({
    required this.value,
    required this.label,
    required this.description,
  });
}

const List<FrenchScenario> frenchScenarios = [
  FrenchScenario(
    value: 'JOB_INTERVIEW',
    label: 'Job Interview',
    description: 'Simulate a full interview with a French recruiter',
  ),
  FrenchScenario(
    value: 'RECRUITER_CALL',
    label: 'Recruiter Call',
    description: 'Simulate calls with French recruiters',
  ),
  FrenchScenario(
    value: 'TEAM_MEETING',
    label: 'Team Meeting',
    description: 'Practice speaking in team meetings',
  ),
  FrenchScenario(
    value: 'DAILY_STANDUP',
    label: 'Daily Standup',
    description: 'Give concise daily updates in French',
  ),
  FrenchScenario(
    value: 'OFFICE_CONVERSATION',
    label: 'Office Chat',
    description: 'Casual conversation with coworkers',
  ),
  FrenchScenario(
    value: 'CUSTOM_JOB',
    label: 'Custom Job',
    description: 'Interview tailored to a specific job description',
  ),
];

FrenchScenario scenarioFor(String value) {
  return frenchScenarios.firstWhere(
    (s) => s.value == value,
    orElse: () => frenchScenarios.first,
  );
}

class FrenchRepository {
  static const String conversationsDocument = r'''
    query FrenchConversations {
      frenchConversations {
        id
        scenario
        jobDescription
        messages {
          id
          role
          content
          evaluation {
            id
            grammarScore
            vocabularyScore
            fluencyScore
            corrections
            improvedVersion
            quebecAlternative
          }
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  ''';

  static const String conversationDocument = r'''
    query FrenchConversation($id: String!) {
      frenchConversation(id: $id) {
        id
        scenario
        jobDescription
        messages {
          id
          role
          content
          evaluation {
            id
            grammarScore
            vocabularyScore
            fluencyScore
            corrections
            improvedVersion
            quebecAlternative
          }
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  ''';

  static const String startDocument = r'''
    mutation StartFrenchConversation($scenario: String!, $jobDescription: String) {
      startFrenchConversation(scenario: $scenario, jobDescription: $jobDescription) {
        conversationId
        response {
          id
          role
          content
          evaluation {
            id
            grammarScore
            vocabularyScore
            fluencyScore
            corrections
            improvedVersion
            quebecAlternative
          }
          createdAt
        }
      }
    }
  ''';

  static const String sendDocument = r'''
    mutation SendFrenchMessage($input: SendFrenchMessageInput!) {
      sendFrenchMessage(input: $input) {
        conversationId
        response {
          id
          role
          content
          evaluation {
            id
            grammarScore
            vocabularyScore
            fluencyScore
            corrections
            improvedVersion
            quebecAlternative
          }
          createdAt
        }
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<FrenchConversation>> listConversations() async {
    final result = await _service.request(
      document: conversationsDocument,
    );
    if (result.hasException) throw result.exception!;
    final list = (result.data?['frenchConversations'] as List<dynamic>? ?? [])
        .map((c) => FrenchConversation.fromJson(c as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<FrenchConversation> getConversation(String id) async {
    final result = await _service.request(
      document: conversationDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['frenchConversation'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Conversation not found');
    return FrenchConversation.fromJson(data);
  }

  Future<SendMessageResult> start({
    required String scenario,
    String? jobDescription,
  }) async {
    final result = await _service.mutate(
      document: startDocument,
      variables: {
        'scenario': scenario,
        'jobDescription': jobDescription,
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['startFrenchConversation'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not start conversation');
    return SendMessageResult.fromJson(data);
  }

  Future<SendMessageResult> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final result = await _service.mutate(
      document: sendDocument,
      variables: {
        'input': {
          'conversationId': conversationId,
          'message': content,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['sendFrenchMessage'] as Map<String, dynamic>?;
    if (data == null) throw Exception('Could not send message');
    return SendMessageResult.fromJson(data);
  }
}
