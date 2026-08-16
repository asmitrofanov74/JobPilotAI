import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth/auth_state.dart';
import 'french_coach_screen.dart';
import 'interview_coach_screen.dart';
import 'linkedin_optimizer_screen.dart';
import 'vocabulary_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('JobPilot AI'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => context.read<AuthState>().logout(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  user?.firstName?.isNotEmpty == true
                      ? user!.firstName![0].toUpperCase()
                      : (user?.email.isNotEmpty == true
                          ? user!.email[0].toUpperCase()
                          : '?'),
                ),
              ),
              title: Text(user?.displayName ?? 'Welcome'),
              subtitle: Text(user?.email ?? ''),
            ),
          ),
          const SizedBox(height: 16),
          const _FeatureCard(
            icon: Icons.record_voice_over,
            title: 'French Coach',
            subtitle: 'Practice job interviews with an AI recruiter.',
            screen: FrenchCoachScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.menu_book,
            title: 'Vocabulary Builder',
            subtitle: 'Learn interview and job-specific French.',
            screen: VocabularyScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.business_center,
            title: 'LinkedIn Optimizer',
            subtitle: 'Polish your profile with AI suggestions.',
            screen: LinkedinOptimizerScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.psychology,
            title: 'Interview Coach',
            subtitle: 'Get feedback and improve your answers.',
            screen: InterviewCoachScreen(),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? screen;

  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.screen,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          if (screen != null) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => screen!),
            );
          }
        },
      ),
    );
  }
}
