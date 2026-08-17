import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth/auth_state.dart';
import '../settings/settings_models.dart';
import '../settings/settings_repository.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final SettingsRepository _repository = SettingsRepository();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _targetRoleController = TextEditingController();
  final TextEditingController _locationsController = TextEditingController();

  UserProfile? _profile;
  String _experienceLevel = '';
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _titleController.dispose();
    _targetRoleController.dispose();
    _locationsController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final profile = await _repository.me();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _firstNameController.text = profile.firstName ?? '';
        _lastNameController.text = profile.lastName ?? '';
        _titleController.text = profile.title ?? '';
        _targetRoleController.text = profile.targetRole ?? '';
        _locationsController.text = profile.targetLocations ?? '';
        _experienceLevel = _normalizeExperienceLevel(profile.experienceLevel);
      });
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _normalizeExperienceLevel(String? value) {
    if (value == null || value.isEmpty) return '';
    final lower = value.toLowerCase();
    for (final level in experienceLevels) {
      if (level.toLowerCase() == lower) return level;
    }
    return '';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final auth = context.read<AuthState>();
    try {
      await _repository.updateProfile(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        title: _titleController.text.trim(),
        targetRole: _targetRoleController.text.trim(),
        experienceLevel: _experienceLevel,
        targetLocations: _locationsController.text.trim(),
      );
      if (auth.user != null) {
        auth.updateUser(auth.user!.copyWith(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
        ));
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Refresh',
          ),
        ],
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
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Subscription',
                            style:
                                Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Icon(
                            profile?.subscriptionTier == 'PRO'
                                ? Icons.workspace_premium
                                : Icons.free_breakfast,
                            color: profile?.subscriptionTier == 'PRO'
                                ? Colors.amber.shade700
                                : Colors.grey.shade600,
                          ),
                          title: Text(
                              'Plan: ${profile?.subscriptionTier ?? 'Free'}'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (profile?.currentPeriodEnd != null)
                                Text(
                                    'Renews: ${_formatDate(profile!.currentPeriodEnd!)}'),
                              Text('Member since: '
                                  '${_formatDate(profile!.createdAt)}'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Profile',
                            style:
                                Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _firstNameController,
                          decoration: const InputDecoration(
                              labelText: 'First Name',
                              border: OutlineInputBorder()),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _lastNameController,
                          decoration: const InputDecoration(
                              labelText: 'Last Name',
                              border: OutlineInputBorder()),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _titleController,
                          decoration: const InputDecoration(
                              labelText: 'Current Title',
                              border: OutlineInputBorder()),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _targetRoleController,
                          decoration: const InputDecoration(
                              labelText: 'Target Role',
                              border: OutlineInputBorder()),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _locationsController,
                          decoration: const InputDecoration(
                              labelText: 'Target Locations (comma separated)',
                              border: OutlineInputBorder()),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _experienceLevel,
                          decoration: const InputDecoration(
                              labelText: 'Experience Level',
                              border: OutlineInputBorder()),
                          items: [
                            const DropdownMenuItem<String>(
                                value: '', child: Text('Not specified')),
                            ...experienceLevels
                                .map((l) => DropdownMenuItem<String>(
                                    value: l, child: Text(l))),
                          ],
                          onChanged: (v) => setState(
                              () => _experienceLevel = v ?? ''),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: _saving ? null : _save,
                            icon: _saving
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2),
                                  )
                                : const Icon(Icons.save),
                            label: Text(_saving ? 'Saving...' : 'Save Profile'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.logout),
                    title: const Text('Sign Out'),
                    onTap: () => context.read<AuthState>().logout(),
                  ),
                ),
              ],
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
