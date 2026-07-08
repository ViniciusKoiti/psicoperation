//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

library openapi.api;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:http/http.dart';
import 'package:intl/intl.dart';
import 'package:meta/meta.dart';

part 'api_client.dart';
part 'api_helper.dart';
part 'api_exception.dart';
part 'auth/authentication.dart';
part 'auth/api_key_auth.dart';
part 'auth/oauth.dart';
part 'auth/http_basic_auth.dart';
part 'auth/http_bearer_auth.dart';


part 'model/appointment.dart';
part 'model/appointment_create_request.dart';
part 'model/appointment_page.dart';
part 'model/appointment_status.dart';
part 'model/appointment_update_request.dart';
part 'model/attendance_record.dart';
part 'model/attendance_status.dart';
part 'model/auth_response.dart';
part 'model/charge.dart';
part 'model/charge_overdue_event.dart';
part 'model/charge_overdue_payload.dart';
part 'model/charge_page.dart';
part 'model/charge_status.dart';
part 'model/create_charge_request.dart';
part 'model/domain_event.dart';
part 'model/field_violation.dart';
part 'model/lead.dart';
part 'model/lead_create_request.dart';
part 'model/login_request.dart';
part 'model/onboarding_complete_request.dart';
part 'model/onboarding_status.dart';
part 'model/onboarding_step.dart';
part 'model/page_meta.dart';
part 'model/patient.dart';
part 'model/patient_create_request.dart';
part 'model/patient_page.dart';
part 'model/patient_status.dart';
part 'model/patient_update_request.dart';
part 'model/payment.dart';
part 'model/payment_method.dart';
part 'model/problem.dart';
part 'model/refresh_token_request.dart';
part 'model/register_payment_request.dart';
part 'model/register_request.dart';
part 'model/reminder.dart';
part 'model/reminder_channel.dart';
part 'model/reminder_create_request.dart';
part 'model/reminder_due_event.dart';
part 'model/reminder_due_payload.dart';
part 'model/reminder_page.dart';
part 'model/reminder_status.dart';
part 'model/session_response.dart';
part 'model/settings.dart';
part 'model/settings_update_request.dart';
part 'model/simple_interest_params.dart';
part 'model/task.dart';
part 'model/task_create_request.dart';
part 'model/task_page.dart';
part 'model/task_update_request.dart';
part 'model/token_pair.dart';
part 'model/user.dart';
part 'model/validation_problem.dart';
part 'model/weekly_recurrence.dart';


/// An [ApiClient] instance that uses the default values obtained from
/// the OpenAPI specification file.
var defaultApiClient = ApiClient();

const _delimiters = {'csv': ',', 'ssv': ' ', 'tsv': '\t', 'pipes': '|'};
const _dateEpochMarker = 'epoch';
const _deepEquality = DeepCollectionEquality();
final _dateFormatter = DateFormat('yyyy-MM-dd');
final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

bool _isEpochMarker(String? pattern) => pattern == _dateEpochMarker || pattern == '/$_dateEpochMarker/';
