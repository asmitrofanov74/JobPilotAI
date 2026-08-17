import 'package:flutter/material.dart';

import '../coverletters/coverletter_models.dart';
import '../coverletters/coverletter_repository.dart';

class CoverLettersScreen extends StatefulWidget {
  const CoverLettersScreen({super.key});

  @override
  State<CoverLettersScreen> createState() => _CoverLettersScreenState();
}

class _CoverLettersScreenState extends State<CoverLettersScreen> {
  final CoverLetterRepository _repository = CoverLetterRepository();
  final TextEditingController _jobTitleController = TextEditingController();
  final TextEditingController _companyController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  List<CoverLetter> _letters = [];
  String _tone = 'professional';
  String? _generated;
  bool _loading = true;
  bool _generating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _jobTitleController.dispose();
    _companyController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final letters = await _repository.list();
      if (!mounted) return;
      setState(() => _letters = letters);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generate() async {
    final jobTitle = _jobTitleController.text.trim();
    final company = _companyController.text.trim();
    final description = _descriptionController.text.trim();
    if (jobTitle.isEmpty || company.isEmpty || description.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Job title, company and description are required')),
      );
      return;
    }
    setState(() {
      _generating = true;
      _generated = null;
    });
    try {
      final content = await _repository.generate(
        jobTitle: jobTitle,
        companyName: company,
        jobDescription: description,
        tone: _tone,
      );
      if (!mounted) return;
      setState(() => _generated = content);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _delete(CoverLetter letter) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete cover letter?'),
        content: Text('${letter.jobTitle} - ${letter.companyName}'),
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
    try {
      await _repository.delete(letter.id);
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cover Letters')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Generate New',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _jobTitleController,
                      decoration: const InputDecoration(
                          labelText: 'Job Title',
                          border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _companyController,
                      decoration: const InputDecoration(
                          labelText: 'Company Name',
                          border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                          labelText: 'Job Description',
                          border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _tone,
                      decoration: const InputDecoration(
                          labelText: 'Tone', border: OutlineInputBorder()),
                      items: coverLetterTones
                          .map((t) => DropdownMenuItem(
                              value: t,
                              child: Text(t[0].toUpperCase() + t.substring(1))))
                          .toList(),
                      onChanged: (v) =>
                          setState(() => _tone = v ?? 'professional'),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _generating ? null : _generate,
                        icon: _generating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.auto_awesome),
                        label: Text(_generating
                            ? 'Generating...'
                            : 'Generate Cover Letter'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (_generated != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Generated',
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(_generated!),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () =>
                            setState(() => _generated = null),
                        child: const Text('Dismiss'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            Text('Saved Letters',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              )
            else if (_letters.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text('No cover letters yet. Generate your first one.'),
              )
            else
              ..._letters.map((l) => Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ListTile(
                      title: Text(l.jobTitle),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l.companyName),
                          Text(
                            '${l.tone} · ${_formatDate(l.createdAt)}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          if (l.content.isNotEmpty)
                            Text(
                              l.content,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20),
                        onPressed: () => _delete(l),
                      ),
                      onTap: () => _showLetter(l),
                    ),
                  )),
          ],
        ),
      ),
    );
  }

  void _showLetter(CoverLetter letter) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(16),
          children: [
            Text(letter.jobTitle,
                style: Theme.of(context).textTheme.titleLarge),
            Text(letter.companyName),
            const SizedBox(height: 12),
            Text(letter.content),
          ],
        ),
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
