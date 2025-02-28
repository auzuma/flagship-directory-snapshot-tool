---FILESTART: config\environment.json---
{
  "environment": "{{ environment }}",
  "debug": {{ debug }},
  "apiKey": "{{ apiKey }}",
  "endpoints": {
    "main": "{{ endpoints.main }}",
    "backup": "{{ endpoints.backup }}"
  },
  "features": {
    "enableLogging": {{ features.enableLogging }},
    "enableCaching": {{ features.enableCaching }},
    "maxCacheSize": {{ features.maxCacheSize }}
  }
}

---FILEEND---

---FILESTART: package.json---
{
  "name": "{{ packageName }}",
  "version": "{{ version }}",
  "description": "{{ projectDescription }}",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node index.js"
  },
  "keywords": [{{ keywords }}],
  "author": "{{ author }}",
  "license": "{{ license }}"
}

---FILEEND---

---FILESTART: premiumServices\foo_service.js---
/* This is a premium service */

/**
 * {{ componentName }} {{ componentType }}
 * {{ componentDescription }}
 */

class {{ componentName }}{{ componentType }} {
    constructor(options = {}) {
      this.name = '{{ componentName }}';
      this.type = '{{ componentType }}';
      this.options = options;
    }
  
    initialize() {
      console.log(`Initializing ${this.name} ${this.type}`);
      {{ initializeCode }}
    }
  
    process(data) {
      return {
        processed: true,
        result: data.map(item => ({ ...item, processed: true })),
        timestamp: new Date().toISOString()
      };
    }
}
  
module.exports = {{ componentName }}{{ componentType }};

---FILEEND---

---FILESTART: README.md---
# {{ projectName }}

{{ projectDescription }}

## Installation

```
npm install {{ packageName }}
```

## Usage

```javascript
const {{ packageVariable }} = require('{{ packageName }}');

{{ packageVariable }}.init({
  environment: '{{ environment }}'
});
```

## Features

{{ features }}

## License

{{ license }}

---FILEEND---

---FILESTART: simpleServices\foo_service.js---
/* This is a simple service */

/**
 * {{ componentName }} {{ componentType }}
 * {{ componentDescription }}
 */

class {{ componentName }}{{ componentType }} {
  constructor(options = {}) {
    this.name = '{{ componentName }}';
    this.type = '{{ componentType }}';
    this.options = options;
  }

  initialize() {
    console.log(`Initializing ${this.name} ${this.type}`);
    {{ initializeCode }}
  }

  process(data) {
    return {
      processed: true,
      result: data.map(item => ({ ...item, processed: true })),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {{ componentName }}{{ componentType }};

---FILEEND---

