import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth/auth_state.dart';
import 'analytics_screen.dart';
import 'cover_letters_screen.dart';
import 'french_coach_screen.dart';
import 'interview_coach_screen.dart';
import 'jobs_screen.dart';
import 'linkedin_optimizer_screen.dart';
import 'resumes_screen.dart';
import 'scraper_screen.dart';
import 'settings_screen.dart';
import 'skills_screen.dart';
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
            icon: Icons.work_outline,
            title: 'Job Tracker',
            subtitle: 'Track applications through your pipeline.',
            screen: JobsScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.description_outlined,
            title: 'Resumes',
            subtitle: 'Store and manage your resume versions.',
            screen: ResumesScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.email_outlined,
            title: 'Cover Letters',
            subtitle: 'Generate AI cover letters from a job posting.',
            screen: CoverLettersScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.insights,
            title: 'Analytics',
            subtitle: 'Funnel and monthly application trends.',
            screen: AnalyticsScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.rule,
            title: 'Skill Gap Analysis',
            subtitle: 'Compare your skills against job requirements.',
            screen: SkillsScreen(),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.search,
            title: 'Job Scraper',
            subtitle: 'Search and import jobs from multiple boards.',
            screen: ScraperScreen(),
          ),
          const SizedBox(height: 12),
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
          const SizedBox(height: 12),
          const _FeatureCard(
            icon: Icons.settings,
            title: 'Settings',
            subtitle: 'Profile, target role, and subscription.',
            screen: SettingsScreen(),
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
