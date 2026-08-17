import 'package:flutter/material.dart';

import '../scraper/scraper_models.dart';
import '../scraper/scraper_repository.dart';

class ScraperScreen extends StatefulWidget {
  const ScraperScreen({super.key});

  @override
  State<ScraperScreen> createState() => _ScraperScreenState();
}

class _ScraperScreenState extends State<ScraperScreen> {
  final ScraperRepository _repository = ScraperRepository();
  final TextEditingController _keywordsController =
      TextEditingController(text: 'software engineer');
  final TextEditingController _locationController =
      TextEditingController(text: 'Toronto, ON');

  String? _source;
  String? _postedWithin;
  ScrapeResult? _result;
  bool _scraping = false;
  bool _importing = false;
  String? _error;

  @override
  void dispose() {
    _keywordsController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _scrape() async {
    final keywords = _keywordsController.text.trim();
    final location = _locationController.text.trim();
    if (keywords.isEmpty || location.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Keywords and location are required')),
      );
      return;
    }
    setState(() {
      _scraping = true;
      _error = null;
      _result = null;
    });
    try {
      final result = await _repository.scrape(
        keywords: keywords,
        location: location,
        postedWithin: _postedWithin,
        source: _source,
      );
      if (!mounted) return;
      setState(() => _result = result);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _scraping = false);
    }
  }

  Future<void> _importAll() async {
    final result = _result;
    if (result == null || result.jobs.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Import jobs?'),
        content: Text('Import ${result.jobs.length} jobs into your list?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Import'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _importing = true);
    try {
      final import = await _repository.import(result.jobs);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                'Imported ${import.imported}, skipped ${import.skipped}')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to import: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Scaffold(
      appBar: AppBar(title: const Text('Job Scraper')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Search Jobs',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _keywordsController,
                    decoration: const InputDecoration(
                        labelText: 'Keywords', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _locationController,
                    decoration: const InputDecoration(
                        labelText: 'Location', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    initialValue: _source,
                    decoration: const InputDecoration(
                        labelText: 'Source', border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem<String?>(
                          value: null, child: Text('All sources')),
                      ...scraperSources
                          .map((s) => DropdownMenuItem<String?>(
                              value: s, child: Text(s))),
                    ],
                    onChanged: (v) => setState(() => _source = v),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String?>(
                    initialValue: _postedWithin,
                    decoration: const InputDecoration(
                        labelText: 'Posted Within',
                        border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem<String?>(
                          value: null, child: Text('Any time')),
                      ...postedWithinOptions
                          .map((s) => DropdownMenuItem<String?>(
                              value: s, child: Text(s))),
                    ],
                    onChanged: (v) => setState(() => _postedWithin = v),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _scraping ? null : _scrape,
                          icon: _scraping
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.search),
                          label: Text(_scraping ? 'Scraping...' : 'Search Jobs'),
                        ),
                      ),
                      if (result != null && result.jobs.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _importing ? null : _importAll,
                            icon: _importing
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Icon(Icons.download),
                            label: Text('Import All (${result.jobs.length})'),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          if (result != null) ...[
            const SizedBox(height: 16),
            Text(
              'Found ${result.total} jobs'
              '${result.imported > 0 ? ' · imported ${result.imported}' : ''}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (result.jobs.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text('No jobs found. Try different keywords.'),
              )
            else
              ...result.jobs.map((j) => Card(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(j.jobTitle,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall),
                              ),
                              if (j.source != null)
                                Chip(
                                  label: Text(j.source!),
                                  visualDensity: VisualDensity.compact,
                                ),
                            ],
                          ),
                          Text(j.companyName,
                              style: Theme.of(context).textTheme.titleMedium),
                          if (j.location != null || j.salaryRange != null)
                            Text([
                              if (j.location != null) j.location!,
                              if (j.salaryRange != null) j.salaryRange!,
                            ].join(' · ')),
                          if (j.jobDescription != null &&
                              j.jobDescription!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              j.jobDescription!,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                  )),
          ],
        ],
      ),
    );
  }
}
