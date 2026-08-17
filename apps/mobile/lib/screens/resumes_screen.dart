import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../resumes/resume_models.dart';
import '../resumes/resumes_repository.dart';

class ResumesScreen extends StatefulWidget {
  const ResumesScreen({super.key});

  @override
  State<ResumesScreen> createState() => _ResumesScreenState();
}

class _ResumesScreenState extends State<ResumesScreen> {
  final ResumesRepository _repository = ResumesRepository();

  List<Resume> _resumes = [];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final resumes = await _repository.list();
      if (!mounted) return;
      setState(() => _resumes = resumes);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _upload() async {
    setState(() => _busy = true);
    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
      );
      if (file == null) return;
      final name = file.name;
      final bytes = await file.readAsBytes();
      final mimeType = _mimeFor(name);
      final dataUrl = 'data:$mimeType;base64,${base64Encode(bytes)}';
      await _repository.create(
        title: name,
        fileUrl: dataUrl,
        fileKey: name,
        fileSize: bytes.length,
        mimeType: mimeType,
        isPrimary: _resumes.isEmpty,
      );
      _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resume uploaded')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _mimeFor(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    return 'application/octet-stream';
  }

  Future<void> _setPrimary(Resume resume) async {
    setState(() => _busy = true);
    try {
      await _repository.setPrimary(resume.id);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to set primary: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete(Resume resume) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete resume?'),
        content: Text(resume.title),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _busy = true);
    try {
      await _repository.delete(resume.id);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resumes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _busy ? null : _upload,
        icon: _busy
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.upload_file),
        label: Text(_busy ? 'Uploading...' : 'Upload Resume'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      _error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                if (_resumes.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 48),
                    child: Column(
                      children: [
                        Icon(Icons.description_outlined,
                            size: 48,
                            color: Theme.of(context).colorScheme.outline),
                        const SizedBox(height: 8),
                        const Text('No Resumes Yet',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600)),
                        const Text('Upload a PDF or DOCX resume'),
                      ],
                    ),
                  )
                else
                  ..._resumes.map((r) => Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Icon(r.mimeType?.contains('pdf') == true
                                ? Icons.picture_as_pdf
                                : Icons.description),
                          ),
                          title: Text(r.title),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${(r.mimeType ?? '').toUpperCase()}'
                                '${r.fileSize != null ? ' · ${formatFileSize(r.fileSize)}' : ''}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              Text(
                                'Uploaded ${_formatDate(r.createdAt)}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              if (r.isPrimary)
                                const Text('Primary',
                                    style: TextStyle(
                                        color: Colors.amber,
                                        fontWeight: FontWeight.w600)),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!r.isPrimary)
                                IconButton(
                                  icon: const Icon(Icons.star_border),
                                  tooltip: 'Set primary',
                                  onPressed: _busy ? null : () => _setPrimary(r),
                                ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline,
                                    size: 20),
                                onPressed:
                                    _busy ? null : () => _delete(r),
                              ),
                            ],
                          ),
                        ),
                      )),
              ],
            ),
    );
  }

  String _formatDate(DateTime dt) {
    final months = const [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }
}
