//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PageMeta {
  /// Returns a new [PageMeta] instance.
  PageMeta({
    required this.page,
    required this.size,
    required this.totalElements,
    required this.totalPages,
  });

  /// Índice da página retornada (base 0).
  ///
  /// Minimum value: 0
  int page;

  /// Tamanho de página solicitado.
  ///
  /// Minimum value: 1
  int size;

  /// Total de itens existentes em todas as páginas.
  ///
  /// Minimum value: 0
  int totalElements;

  /// Total de páginas disponíveis.
  ///
  /// Minimum value: 0
  int totalPages;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PageMeta &&
    other.page == page &&
    other.size == size &&
    other.totalElements == totalElements &&
    other.totalPages == totalPages;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (page.hashCode) +
    (size.hashCode) +
    (totalElements.hashCode) +
    (totalPages.hashCode);

  @override
  String toString() => 'PageMeta[page=$page, size=$size, totalElements=$totalElements, totalPages=$totalPages]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'page'] = this.page;
      json[r'size'] = this.size;
      json[r'totalElements'] = this.totalElements;
      json[r'totalPages'] = this.totalPages;
    return json;
  }

  /// Returns a new [PageMeta] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PageMeta? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'page'), 'Required key "PageMeta[page]" is missing from JSON.');
        assert(json[r'page'] != null, 'Required key "PageMeta[page]" has a null value in JSON.');
        assert(json.containsKey(r'size'), 'Required key "PageMeta[size]" is missing from JSON.');
        assert(json[r'size'] != null, 'Required key "PageMeta[size]" has a null value in JSON.');
        assert(json.containsKey(r'totalElements'), 'Required key "PageMeta[totalElements]" is missing from JSON.');
        assert(json[r'totalElements'] != null, 'Required key "PageMeta[totalElements]" has a null value in JSON.');
        assert(json.containsKey(r'totalPages'), 'Required key "PageMeta[totalPages]" is missing from JSON.');
        assert(json[r'totalPages'] != null, 'Required key "PageMeta[totalPages]" has a null value in JSON.');
        return true;
      }());

      return PageMeta(
        page: mapValueOfType<int>(json, r'page')!,
        size: mapValueOfType<int>(json, r'size')!,
        totalElements: mapValueOfType<int>(json, r'totalElements')!,
        totalPages: mapValueOfType<int>(json, r'totalPages')!,
      );
    }
    return null;
  }

  static List<PageMeta> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PageMeta>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PageMeta.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PageMeta> mapFromJson(dynamic json) {
    final map = <String, PageMeta>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PageMeta.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PageMeta-objects as value to a dart map
  static Map<String, List<PageMeta>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PageMeta>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PageMeta.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'page',
    'size',
    'totalElements',
    'totalPages',
  };
}

