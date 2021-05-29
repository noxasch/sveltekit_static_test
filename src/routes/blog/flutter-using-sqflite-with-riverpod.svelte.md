---
Title: Flutter: Using sqflite with riverpod
Date: 2020-11-19
Authors: Alexander Dischberg
Tags: flutter, sqlite, sqflite, riverpod
---

This is a rewrite of my previous post but using riverpod instead of provider. The advantages of using riverpod is that the code is more readable, much more simpler and avoid nested builder as you can use the provider without context. This is an early post while i'm still figuring out riverpod, i will update when necessary with more practical example.

Updates: Fix using riverpod provider from another provider

If you have question, need some help or feedback, don't hesitate to reach me on <a href="https://twitter.com/noxasch" target="_blank" rel="noopener noreferrer nofollow">twitter</a>.

## Introduction

Riverpod is another state management library by the same author of provider package. Riverpod come with the goal 
to make provider even simpler without affecting provider. It can be use with flutter_hooks directly.

## Advantages of Riverpods

- Declare provider and provider class in one file without convoluting app root
- provider can be access from anywhere using ConsumerWidget or context.read
- provider can easily consume another provider using `ProviderReference`

## Improvement that can be done

- Proper error handling if needed.
- Proper SQL pagination for large datasets

## Test Consideration

- Unit Test are not possible except to mock it (if you aspire to achieve that 100% mark)
- Exclude the provider during widget test and pass empty list instead.
- For widget test i swap it with dummy data instead
- If you still want to test it automatically, write an integration test intead.

### Define Database Provider

```java
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart' as sql;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as path;

final dbProvider = ChangeNotifierProvider<DataBaseHelperProvider>((ref) {
  return DataBaseProvider();
});

class DataBaseHelperProvider with ChangeNotifier {
  static final tableName = 'my_table';
  sql.Database db;

  DataBaseProvider() {
    // this will run when provider is instantiate the first time
    init();
  }

  void init() async {
    final dbPath = await sql.getDatabasesPath();
    db = await sql.openDatabase(
      path.join(dbPath, 'places.db'),
      onCreate: (db, version) {
        final stmt = '''CREATE TABLE IF NOT EXISTS $tableName (
            id TEXT PRIMARY KEY,
            title TEXT,
            image TEXT
        )'''.trim().replaceAll(RegExp(r'[\s]{2,}'), ' ');
        return db.execute(stmt);
      },
      version: 1,
    );
    // the init funciton is async so it won't block the main thread
    // notify provider that depends on it when done
    notifyListeners();
  }

  Future<void> insert(String table, Map<String, Object> data) async {
    await db.insert(table, data, conflictAlgorithm: sql.ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getData(String table) async {
    return await db.query(table);
  }
}
```

### Other provider that depends on Database provider

```java
// data_provider.dart
import 'dart:io'; // because we are using File in here

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import './db_helper_provider.dart';
import '../models/data.dart';

final dataProvider = ChangeNotifierProvider<DataProvider>((ref) {
  return DataProvider(ref);
});

class DataProvider with ChangeNotifier {
  final ProviderReference ref;
  List<Data> _items = [];
  final tableName = 'my_table';

  DataProvider(this.ref) {
    if (ref != null)
      fetchAndSetData();
  }

  List<Data> get items => [..._items];

  void addPlace(String title, File selectedImage) {
    final db = ref.read(dbProvider).db;
    if (db != null) { // do not execute if db is not instantiate
      final newPlace = Place(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: title,
          location: null,
          image: selectedImage
        );
      _items.add(newPlace);
      notifyListeners();
      ref.read(dbProvider).insert(tableName,
        {'id': newPlace.id, 'title': newPlace.title, 'image': newPlace.image.path});
    }
  }

  Future<void> fetchAndSetData() async {
    final db = ref.read(dbProvider).db;
    if (db != null) { // do not execute if db is not instantiate
      final dataList = await dbProvider.getData(tableName);
      _items = dataList.map((item) => Data(
        id: item['id'],
        title: item['title'],
        image: File(item['image'])
      )).toList();
      notifyListeners();
    }
  }
}

```

### Using the Provider method

```java
// main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:../provider/database_helper.dart';
import 'package:../provider/data_provider.dart';

void main() {
  runApp(ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        ...
        floatingActionButton: FloatingActionButton(
          child: Icon(Icons.add),
          // using riverpod provider method in widget
          // we can access it via build context directly
          onTap: () => context.read(dataProvider).addPlace( ... )
        )
    );
  }
}
```

## References

- <a href="https://pub.dev/packages/sqflite" target="_blank" rel="noopener noreferrer nofollow">Sqflite on pub.dev</a>
- <a href="https://github.com/tekartik/sqflite" target="_blank" rel="noopener noreferrer nofollow">sqflite github repo</a>
- <a href="https://riverpod.dev/docs/getting_started" target="_blank" rel="noopener noreferrer nofollow">riverpod docs</a>
- <a href="https://medium.com/@mxiskw/flutter-pragmatic-architecture-using-riverpod-123ae11a8267" target="_blank" rel="noopener noreferrer nofollow">Flutter | Pragmatic Architecture using Riverpod</a>
- <a href="https://www.youtube.com/watch?v=GVspNESSess" target="_blank" rel="noopener noreferrer nofollow">Robert Brunhage - State Management Like A Pro - Flutter Riverpod</a>
