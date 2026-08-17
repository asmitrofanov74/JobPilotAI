import '../graphql/graphql_service.dart';
import 'coverletter_models.dart';

class CoverLetterRepository {
  static const String listDocument = r'''
    query CoverLetters {
      coverLetters {
        id
        jobTitle
        companyName
        content
        tone
        jobDescription
        isGenerated
        createdAt
      }
    }
  ''';

  static const String generateDocument = r'''
    mutation GenerateCoverLetter($input: GenerateCoverLetterInput!) {
      generateCoverLetter(input: $input) {
        coverLetter {
          id
          jobTitle
          companyName
          content
          tone
          isGenerated
          createdAt
        }
        content
      }
    }
  ''';

  static const String deleteDocument = r'''
    mutation DeleteCoverLetter($id: String!) {
      deleteCoverLetter(id: $id)
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<CoverLetter>> list() async {
    final result = await _service.request(document: listDocument);
    if (result.hasException) throw result.exception!;
    return (result.data?['coverLetters'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => CoverLetter.fromJson(m.cast<String, dynamic>()))
        .toList();
  }

  Future<String> generate({
    required String jobTitle,
    required String companyName,
    required String jobDescription,
    String tone = 'professional',
  }) async {
    final result = await _service.mutate(
      document: generateDocument,
      variables: {
        'input': {
          'jobTitle': jobTitle,
          'companyName': companyName,
          'jobDescription': jobDescription,
          'tone': tone,
        },
      },
    );
    if (result.hasException) throw result.exception!;
    final data = result.data?['generateCoverLetter'];
    if (data is! Map) throw Exception('No result from server');
    final content = data['content'];
    if (content is String && content.isNotEmpty) return content;
    final coverLetter = data['coverLetter'];
    if (coverLetter is Map) {
      final c = coverLetter['content'];
      if (c is String) return c;
    }
    throw Exception('No content returned from server');
  }

  Future<void> delete(String id) async {
    final result = await _service.mutate(
      document: deleteDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
  }
}
