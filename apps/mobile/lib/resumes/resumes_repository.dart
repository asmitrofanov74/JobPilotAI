import '../graphql/graphql_service.dart';
import 'resume_models.dart';

class ResumesRepository {
  static const String listDocument = r'''
    query Resumes {
      resumes {
        id
        title
        fileUrl
        fileKey
        fileSize
        mimeType
        isPrimary
        parsedSkills
        parsedExperience
        parsedEducation
        createdAt
        updatedAt
      }
    }
  ''';

  static const String createDocument = r'''
    mutation CreateResume($input: CreateResumeInput!) {
      createResume(input: $input) {
        id
        title
        fileUrl
        isPrimary
        createdAt
      }
    }
  ''';

  static const String deleteDocument = r'''
    mutation DeleteResume($id: String!) {
      deleteResume(id: $id)
    }
  ''';

  static const String setPrimaryDocument = r'''
    mutation SetPrimaryResume($id: String!) {
      setPrimaryResume(id: $id) {
        id
        title
        isPrimary
      }
    }
  ''';

  final GraphqlService _service = GraphqlService.instance;

  Future<List<Resume>> list() async {
    final result = await _service.request(document: listDocument);
    if (result.hasException) throw result.exception!;
    return (result.data?['resumes'] as List<dynamic>? ?? [])
        .whereType<Map>()
        .map((m) => Resume.fromJson(m.cast<String, dynamic>()))
        .toList();
  }

  Future<void> create({
    required String title,
    required String fileUrl,
    required String fileKey,
    int? fileSize,
    String? mimeType,
    bool isPrimary = false,
  }) async {
    final input = <String, dynamic>{
      'title': title,
      'fileUrl': fileUrl,
      'fileKey': fileKey,
      'isPrimary': isPrimary,
      'fileSize': ?fileSize,
    };
    if (mimeType != null && mimeType.isNotEmpty) input['mimeType'] = mimeType;
    final result = await _service.mutate(
      document: createDocument,
      variables: {'input': input},
    );
    if (result.hasException) throw result.exception!;
  }

  Future<void> delete(String id) async {
    final result = await _service.mutate(
      document: deleteDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
  }

  Future<void> setPrimary(String id) async {
    final result = await _service.mutate(
      document: setPrimaryDocument,
      variables: {'id': id},
    );
    if (result.hasException) throw result.exception!;
  }
}
