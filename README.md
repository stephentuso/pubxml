pubxml
======

[ ![npm](https://img.shields.io/npm/v/pubxml.svg) ](https://www.npmjs.com/package/pubxml)

Generates `public.xml` for Android libraries, which allows resources to be hidden from clients. [More info](https://developer.android.com/studio/projects/android-library.html#PrivateResources)

Usage
-----

Install with `npm install -g pubxml`

For now, this assumes that public and private resources are in separate directories, such as `res` and `res-public`.

To add `res-public`, make a folder with that name in the same directory as `res`, probably `[library-module]/src/main`. Add the following to the module's `build.gradle`:

```groovy
android {
    ...
    sourceSets {
        main.res.srcDirs += 'src/main/res-public'
    }
    ...
}
```

Once the public resources are in a separate directory, open a terminal and navigate to that dir. Generate `public.xml` by running `pubxml`.

You can also run `pubxml` automatically before each build in Android Studio. To get it working on Mac OS and linux, you can add the following to the library module gradle file:

```
task generatePublicXml(type: Exec) {
    workingDir 'src/main/res-public'
    commandLine 'bash', '-c', 'export PATH="$PATH:/usr/local/bin"; pubxml'
    ignoreExitValue true
}

//Don't run pubxml task on Windows
if (! System.getProperty('os.name').toLowerCase().contains('windows')) {
    preBuild.dependsOn generatePublicXml
}
```

Change `workingDir` if you used a different folder name. I don't have a Windows computer to test it on, so it is disabled on Windows to prevent the build from failing.

License
-------

Released under the MIT License.
