# Dialog Commands

# Merge

# Verify

# Form
The form command generates .lu, .lg, .qna and .dialog assets from a schema defined using JSON Schema.  The parameters to the command are:
* **--force, -f** Force overwriting generated files.
* **--help, -h** Generate help.
* **--locale, -l** Locales to generate.  By default en-us.
* **--output, -o** Output directory.
* **--schema, -s** Path to your app.schema file. By default is the standard SDK app.schema.
* **--templates, -t** Directories with templates to use for generating form assets.
* **--verbose, -v** Verbose logging of generated files.

## Schema
Schemas are specified using JSON Schema.  You can use the normal JSON Schema mechanisms including $ref and allOf which will be resolved into a single schema.  In addition there are a few extra keywords including:
* **$mappings** List of entity names that can map to a property. The order of the entities also defines the precedence to use when resolving entities.  By default the mappings are based on the type:
  * **enum**
  * **number**, **string**
* **$templates** The template names to use for generating assets. $templates can be defined at the top-level in a schema or per-property which by default are based on the type:
  * **enum**
  * **number**, **string**
* **\$expectedOnly** A list of properties that are only possible if they are expected.
* **\$requires** A list of JSON Schema to use for internal mechanisms.  You can use either actual paths or just the name of the schema to use if found in one of the template directories.  The standard schema is `standard.schema.dialog`.  The form schema and all of the required schemas will have the top-level `properties`, `definitions`, `required`, `$expectedOnly` and `$templates` merged.
* **\$triggerIntent** Name of the trigger intent or by default the name of the form.

`<form>.form.dialog` will be generated with the form schema in it.  `<form>.schema.dialog` will have the whole schema defined.

## Templates
Each entity or property can have associated .lu, .lg, .qna and .dialog files that are generated by 
copying or instantiating templates found in the template directories.  If a template name matches exactly it is
just copied.  If the template ends with .lg then it is analyzed to see if it has a template named 'template' and optionally one named 'filename'.  If 'filename' is specified, then the filename will be the result of generating generated file is the result of evaluating that template, otherwise it defaults to `<formName>-<templateName>[.<locale>].<extension>`.  When evaluating templates there are a number of variables defined in the scope including:
* **formName** The name of the form being generated.
* **appSchema** The path to the app.schema to use. 
* **form** The JSON Schema defining the form.
* **schema** The JSON Schema of the form + internal properties.
* **locales** The list of all locales being generated.
* **properties** All of the form property names.
* **entities** All of the types of schema entities being used.
* **triggerIntent** $triggerIntent or the form name by default.
* **locale** The locale being generated or empty if no locale.
* **property** For per-property templates this the property name being generated.
* **templates** Object with generated templates per lu, lg, qna, json and dialog.  The object contains:
  * **name** Base name of the template without final extension.
  * **fullName** The name of the template including the extension.
  * **relative** Path relative to the output directory of where template is.

Templates are generated in the following order:
* Generate per-locale language resources
  * Per-entity generate .lg, .lu, .qna files
  * Per-property
    * Per-template in `<property>.$templates` generate .lg, .lu, .qna files.
  * Per-template in `$templates` generate .lg, .lu, .qna files.
* Generate non language resources
  * Per-property
    * Per-template in `<property>.$templates` generate .dialog and .json files.
  * Per-template in `$templates` generate .dialog and .json files.