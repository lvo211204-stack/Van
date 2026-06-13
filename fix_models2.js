const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Fix 1: getMappedModel
content = content.replace(
    /\} else \{\s*if \(finalModel\.includes\('gemini'\) \|\| finalModel\.includes\('claude'\)\) \{\s*finalModel = 'gpt-4o';\s*\}\s*\}/g,
    '} else {\n        // Do nothing for custom proxies\n    }'
);

// Fix 2: generateStoryStream
content = content.replace(
    /\} else \{\s*\/\/ For other OpenAI-compatible proxies, replace unsupported models with GPT-4o\s*if \(activeModel\.includes\('gemini'\) \|\| activeModel\.includes\('claude'\)\) \{\s*activeModel = 'gpt-4o';\s*\}\s*\}/g,
    '} else {\n            // Do nothing for custom proxies\n        }'
);

fs.writeFileSync('services/geminiService.ts', content);
