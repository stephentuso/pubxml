pubxml
======

[ ![npm](https://img.shields.io/npm/v/pubxml.svg) ](https://www.npmjs.com/package/pubxml)

Generates `public.xml` for Android libraries, which allows resources to be hidden from clients. [More info](http://tools.android.com/tech-docs/private-resources)

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

Once the public resources are in a separate directory, open a terminal and `cd` to that dir. Generate `public.xml` by simply running `pubxml`.

License
-------

Released under the MIT License.
