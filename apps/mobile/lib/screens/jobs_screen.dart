import 'dart:async';

import 'package:flutter/material.dart';

import '../jobs/job_models.dart';
import '../jobs/jobs_repository.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final JobsRepository _repository = JobsRepository();
  final TextEditingController _searchController = TextEditingController();

  List<Job> _jobs = [];
  PaginationMeta _meta =
      PaginationMeta(total: 0, page: 1, limit: 20, totalPages: 0);
  String _status = '';
  int _page = 1;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _load();
  }

  void _onSearchChanged() {
    _searchTimer?.cancel();
    _searchTimer = Timer(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      _page = 1;
      _load();
    });
  }

  Timer? _searchTimer;

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _searchTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await _repository.list(
        page: _page,
        limit: 20,
        status: _status.isEmpty ? null : _status,
        search: _searchController.text.trim().isEmpty
            ? null
            : _searchController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _jobs = result.jobs;
        _meta = result.meta;
      });
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _selectStatus(String status) {
    setState(() => _status = status);
    _page = 1;
    _load();
  }

  Future<void> _openForm({Job? job}) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => JobFormScreen(job: job)),
    );
    if (changed == true) _load();
  }

  Future<void> _openDetail(Job job) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => JobDetailScreen(job: job)),
    );
    if (changed == true) _load();
  }

  Future<void> _deleteJob(Job job) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete job?'),
        content: Text('${job.companyName} - ${job.jobTitle}'),
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
      await _repository.delete(job.id);
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
      appBar: AppBar(
        title: const Text('Jobs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        tooltip: 'Add job',
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search by company or title...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: const Text('All'),
                    selected: _status.isEmpty,
                    onSelected: (_) => _selectStatus(''),
                  ),
                ),
                ...jobStatuses.map((s) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: ChoiceChip(
                        label: Text(jobStatusLabel(s)),
                        selected: _status == s,
                        onSelected: (_) => _selectStatus(s),
                      ),
                    )),
              ],
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _jobs.isEmpty
                    ? _buildEmpty(context)
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.only(bottom: 80),
                          itemCount: _jobs.length,
                          itemBuilder: (context, index) {
                            final job = _jobs[index];
                            return _buildJobCard(context, job);
                          },
                        ),
                      ),
          ),
          if (_meta.totalPages > 1)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton(
                    onPressed: _page > 1
                        ? () {
                            setState(() => _page--);
                            _load();
                          }
                        : null,
                    child: const Text('Previous'),
                  ),
                  Text('Page ${_meta.page} of ${_meta.totalPages} '
                      '(${_meta.total} jobs)'),
                  TextButton(
                    onPressed: _page < _meta.totalPages
                        ? () {
                            setState(() => _page++);
                            _load();
                          }
                        : null,
                    child: const Text('Next'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.work_outline,
              size: 48, color: Theme.of(context).colorScheme.outline),
          const SizedBox(height: 8),
          const Text('No Jobs Found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const Text('Tap + to track your first application'),
        ],
      ),
    );
  }

  Widget _buildJobCard(BuildContext context, Job job) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListTile(
        title: Text(job.jobTitle),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(job.companyName),
            if (job.location != null || job.salaryRange != null)
              Text(
                [
                  if (job.location != null) job.location!,
                  if (job.salaryRange != null) job.salaryRange!,
                ].join(' · '),
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
        leading: CircleAvatar(child: Text(_initials(job.companyName))),
        trailing: Wrap(
          spacing: 4,
          children: [
            _statusChip(job.status),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 20),
              onPressed: () => _deleteJob(job),
            ),
          ],
        ),
        onTap: () => _openDetail(job),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '?';
    final first = parts.first[0];
    if (parts.length > 1 && parts[1].isNotEmpty) {
      return (first + parts[1][0]).toUpperCase();
    }
    return first.toUpperCase();
  }

  Widget _statusChip(String status) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        jobStatusLabel(status),
        style: TextStyle(fontSize: 11, color: color),
      ),
    );
  }
}

Color statusColor(String status) {
  switch (status) {
    case 'SAVED':
      return Colors.grey.shade700;
    case 'APPLIED':
      return Colors.blue.shade700;
    case 'PHONE_SCREEN':
      return Colors.teal.shade700;
    case 'TECHNICAL':
      return Colors.indigo.shade700;
    case 'ONSITE':
      return Colors.purple.shade700;
    case 'OFFER':
      return Colors.green.shade700;
    case 'REJECTED':
      return Colors.red.shade700;
    case 'WITHDRAWN':
      return Colors.orange.shade700;
    case 'ACCEPTED':
      return Colors.green.shade900;
    default:
      return Colors.grey.shade700;
  }
}

class JobFormScreen extends StatefulWidget {
  final Job? job;

  const JobFormScreen({super.key, this.job});

  @override
  State<JobFormScreen> createState() => _JobFormScreenState();
}

class _JobFormScreenState extends State<JobFormScreen> {
  final JobsRepository _repository = JobsRepository();
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _companyController;
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _urlController;
  late final TextEditingController _salaryController;
  late final TextEditingController _locationController;
  late final TextEditingController _notesController;

  String _status = 'SAVED';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final job = widget.job;
    _companyController =
        TextEditingController(text: job?.companyName ?? '');
    _titleController = TextEditingController(text: job?.jobTitle ?? '');
    _descriptionController =
        TextEditingController(text: job?.jobDescription ?? '');
    _urlController = TextEditingController(text: job?.jobUrl ?? '');
    _salaryController = TextEditingController(text: job?.salaryRange ?? '');
    _locationController = TextEditingController(text: job?.location ?? '');
    _notesController = TextEditingController(text: job?.notes ?? '');
    _status = job?.status ?? 'SAVED';
  }

  @override
  void dispose() {
    _companyController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _urlController.dispose();
    _salaryController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final job = widget.job;
      if (job == null) {
        await _repository.create(
          companyName: _companyController.text.trim(),
          jobTitle: _titleController.text.trim(),
          jobDescription: _descriptionController.text.trim(),
          jobUrl: _urlController.text.trim(),
          status: _status,
          salaryRange: _salaryController.text.trim(),
          location: _locationController.text.trim(),
          notes: _notesController.text.trim(),
        );
      } else {
        await _repository.update(
          job.id,
          companyName: _companyController.text.trim(),
          jobTitle: _titleController.text.trim(),
          jobDescription: _descriptionController.text.trim(),
          jobUrl: _urlController.text.trim(),
          status: _status,
          salaryRange: _salaryController.text.trim(),
          location: _locationController.text.trim(),
          notes: _notesController.text.trim(),
        );
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.job == null ? 'Add Job' : 'Edit Job')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _companyController,
              decoration: const InputDecoration(
                  labelText: 'Company', border: OutlineInputBorder()),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Company is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                  labelText: 'Job Title', border: OutlineInputBorder()),
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Job title is required'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                  labelText: 'Job Description', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _urlController,
              decoration: const InputDecoration(
                  labelText: 'Job URL', border: OutlineInputBorder()),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                  labelText: 'Location', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _salaryController,
              decoration: const InputDecoration(
                  labelText: 'Salary Range', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                  labelText: 'Notes', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            Text('Status', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: jobStatuses.map((s) {
                return ChoiceChip(
                  label: Text(jobStatusLabel(s)),
                  selected: _status == s,
                  onSelected: (_) => setState(() => _status = s),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.save),
              label: Text(_saving ? 'Saving...' : 'Save Job'),
            ),
          ],
        ),
      ),
    );
  }
}

class JobDetailScreen extends StatefulWidget {
  final Job job;

  const JobDetailScreen({super.key, required this.job});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  final JobsRepository _repository = JobsRepository();
  late Job _job = widget.job;
  List<JobInterview> _interviews = [];
  bool _loadingInterviews = false;

  @override
  void initState() {
    super.initState();
    _loadInterviews();
  }

  Future<void> _loadInterviews() async {
    setState(() => _loadingInterviews = true);
    try {
      final all = await _repository.interviews();
      if (!mounted) return;
      setState(() {
        _interviews =
            all.where((i) => i.jobApplicationId == _job.id).toList();
      });
    } catch (_) {
      // Interviews are best-effort on the detail page.
    } finally {
      if (mounted) setState(() => _loadingInterviews = false);
    }
  }

  Future<void> _editJob() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => JobFormScreen(job: _job)),
    );
    if (changed == true) {
      if (!mounted) return;
      Navigator.pop(context, true);
    }
  }

  Future<void> _changeStatus() async {
    final selected = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Change status'),
        children: jobStatuses
            .map((s) => SimpleDialogOption(
                  onPressed: () => Navigator.pop(ctx, s),
                  child: Text(jobStatusLabel(s)),
                ))
            .toList(),
      ),
    );
    if (selected == null || selected == _job.status) return;
    try {
      await _repository.update(_job.id, status: selected);
      if (!mounted) return;
      setState(() => _job = Job(
            id: _job.id,
            companyName: _job.companyName,
            jobTitle: _job.jobTitle,
            jobDescription: _job.jobDescription,
            jobUrl: _job.jobUrl,
            status: selected,
            source: _job.source,
            salaryRange: _job.salaryRange,
            location: _job.location,
            notes: _job.notes,
            createdAt: _job.createdAt,
            updatedAt: DateTime.now(),
            interviews: _job.interviews,
          ));
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update status: $e')),
      );
    }
  }

  Future<void> _deleteJob() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete job?'),
        content: Text('${_job.companyName} - ${_job.jobTitle}'),
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
      await _repository.delete(_job.id);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete: $e')),
      );
    }
  }

  Future<void> _addInterview() async {
    final scheduledAt = _job.interviews.isNotEmpty
        ? _job.interviews.first.scheduledAt
        : null;
    final selected = await showDialog<_InterviewFormResult>(
      context: context,
      builder: (_) => _InterviewFormDialog(initialScheduledAt: scheduledAt),
    );
    if (selected == null) return;
    try {
      await _repository.createInterview(
        jobApplicationId: _job.id,
        type: selected.type,
        scheduledAt: selected.scheduledAt,
        durationMinutes: selected.durationMinutes,
        notes: selected.notes,
      );
      _loadInterviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Interview added')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add interview: $e')),
      );
    }
  }

  Future<void> _toggleInterview(JobInterview interview) async {
    try {
      await _repository.updateInterview(
        interview.id,
        isCompleted: !interview.isCompleted,
      );
      _loadInterviews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update interview: $e')),
      );
    }
  }

  Future<void> _deleteInterview(JobInterview interview) async {
    try {
      await _repository.deleteInterview(interview.id);
      _loadInterviews();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete interview: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_job.jobTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _editJob,
            tooltip: 'Edit',
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: _deleteJob,
            tooltip: 'Delete',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(_job.companyName,
                    style: Theme.of(context).textTheme.titleLarge),
              ),
              _statusChipDetail(_job.status),
            ],
          ),
          const SizedBox(height: 8),
          if (_job.location != null || _job.salaryRange != null)
            Text([
              if (_job.location != null) _job.location!,
              if (_job.salaryRange != null) _job.salaryRange!,
            ].join(' · ')),
          const SizedBox(height: 8),
          Text('Added ${_formatDate(_job.createdAt)}'),
          if (_job.jobDescription != null &&
              _job.jobDescription!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Job Description',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(_job.jobDescription!),
          ],
          if (_job.notes != null && _job.notes!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Notes', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(_job.notes!),
          ],
          if (_job.jobUrl != null && _job.jobUrl!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Job URL', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(_job.jobUrl!,
                style: TextStyle(color: Theme.of(context).colorScheme.primary)),
          ],
          const SizedBox(height: 16),
          FilledButton.tonal(
            onPressed: _changeStatus,
            child: const Text('Change Status'),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Text('Interviews',
                    style: Theme.of(context).textTheme.titleMedium),
              ),
              TextButton.icon(
                onPressed: _addInterview,
                icon: const Icon(Icons.add),
                label: const Text('Add'),
              ),
            ],
          ),
          if (_loadingInterviews)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_interviews.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text('No interviews yet. Add the first one.'),
            )
          else
            ..._interviews.map((i) => Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    leading: Icon(
                      i.isCompleted
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      color: i.isCompleted
                          ? Colors.green.shade600
                          : Theme.of(context).colorScheme.outline,
                    ),
                    title: Text(i.type.replaceAll('_', ' ')),
                    subtitle: Text([
                      if (i.scheduledAt != null)
                        'Scheduled: ${_formatDate(i.scheduledAt!)}',
                      if (i.durationMinutes != null)
                        '${i.durationMinutes} min',
                      if (i.notes != null && i.notes!.isNotEmpty) i.notes!,
                    ].join(' · ')),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      onPressed: () => _deleteInterview(i),
                    ),
                    onTap: () => _toggleInterview(i),
                  ),
                )),
        ],
      ),
    );
  }

  Widget _statusChipDetail(String status) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        jobStatusLabel(status),
        style: TextStyle(fontSize: 12, color: color),
      ),
    );
  }

  String _formatDate(Object? value) {
    final DateTime? dt = value is DateTime
        ? value
        : (value is String ? DateTime.tryParse(value) : null);
    if (dt == null) return value?.toString() ?? '';
    final local = dt.toLocal();
    final months = const [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${local.day} ${months[local.month - 1]} ${local.year}';
  }
}

class _InterviewFormResult {
  final String type;
  final String scheduledAt;
  final int? durationMinutes;
  final String notes;

  _InterviewFormResult({
    required this.type,
    required this.scheduledAt,
    this.durationMinutes,
    required this.notes,
  });
}

class _InterviewFormDialog extends StatefulWidget {
  final String? initialScheduledAt;

  const _InterviewFormDialog({this.initialScheduledAt});

  @override
  State<_InterviewFormDialog> createState() => _InterviewFormDialogState();
}

class _InterviewFormDialogState extends State<_InterviewFormDialog> {
  String _type = interviewTypes.first;
  final TextEditingController _scheduledController = TextEditingController();
  final TextEditingController _durationController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final initial = widget.initialScheduledAt;
    if (initial != null) {
      final dt = DateTime.tryParse(initial);
      if (dt != null) {
        _scheduledController.text =
            '${dt.year}-${_two(dt.month)}-${_two(dt.day)}T${_two(dt.hour)}:${_two(dt.minute)}:00';
      }
    }
  }

  String _two(int v) => v.toString().padLeft(2, '0');

  @override
  void dispose() {
    _scheduledController.dispose();
    _durationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add Interview'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: const InputDecoration(
                  labelText: 'Type', border: OutlineInputBorder()),
              items: interviewTypes
                  .map((t) => DropdownMenuItem(
                      value: t, child: Text(t.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => _type = v ?? _type),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _scheduledController,
              decoration: const InputDecoration(
                  labelText: 'Scheduled (YYYY-MM-DDTHH:MM:SS)',
                  border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _durationController,
              decoration: const InputDecoration(
                  labelText: 'Duration (minutes)',
                  border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                  labelText: 'Notes', border: OutlineInputBorder()),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            final result = _InterviewFormResult(
              type: _type,
              scheduledAt: _scheduledController.text.trim(),
              durationMinutes: int.tryParse(_durationController.text.trim()),
              notes: _notesController.text.trim(),
            );
            Navigator.pop(context, result);
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}
