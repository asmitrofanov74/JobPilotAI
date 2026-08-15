import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:jobpilot_mobile/main.dart';

void main() {
  testWidgets('App boots to auth gate', (WidgetTester tester) async {
    await tester.pumpWidget(const JobPilotApp());
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
