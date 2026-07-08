import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../data/profile_repository.dart';

/// Estados possíveis do carregamento do perfil na Home.
enum HomeStatus { loading, ready, error }

/// Estado (separado da apresentação) da feature Home.
///
/// Um [ChangeNotifier] simples é suficiente para o scaffold; a escolha de uma
/// solução de estado mais robusta (Riverpod/Bloc) fica para quando as features
/// de domínio chegarem. Depende de [ProfileRepository] por injeção — o
/// entrypoint decide qual adapter (mock ou real) fornecer.
final class HomeController extends ChangeNotifier {
  HomeController(this._repository);

  final ProfileRepository _repository;

  HomeStatus _status = HomeStatus.loading;
  HomeStatus get status => _status;

  User? _profile;
  User? get profile => _profile;

  Future<void> load() async {
    _status = HomeStatus.loading;
    notifyListeners();
    try {
      _profile = await _repository.currentProfile();
      _status = HomeStatus.ready;
    } catch (_) {
      _status = HomeStatus.error;
    }
    notifyListeners();
  }
}
