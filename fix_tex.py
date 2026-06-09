import os
import re

tex_dir = 'doc/outputs'
files = [f for f in os.listdir(tex_dir) if f.endswith('.tex')]

terms = {
    r'\bmicroservices\b': 'Microservices',
    r'\bmicroservice\b': 'Microservice',
    r'\bfrontend\b': 'Frontend',
    r'\bbackend\b': 'Backend',
    r'\bunit test\b': 'Unit Test',
    r'\bend-to-end\b': 'End-to-End',
    r'\bapi gateway\b': 'API Gateway',
    r'\bdatabase\b': 'Database'
}

for file in files:
    path = os.path.join(tex_dir, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Space before comma or period (only if preceded by word character to avoid messing up formatting)
    content = re.sub(r'(\w)\s+([,\.])', r'\1\2', content)

    # Replace terms (case sensitive to fix lowercase ones, without touching already capitalized ones or URLs hopefully if they are lowercase we just capitalize them)
    # Actually, let's only replace exact lowercase matches to avoid messing up camelCase or URLs too much.
    content = content.replace(' microservices', ' Microservices')
    content = content.replace(' microservice', ' Microservice')
    content = content.replace(' frontend', ' Frontend')
    content = content.replace(' backend', ' Backend')
    content = content.replace(' unit test', ' Unit Test')
    content = content.replace(' end-to-end', ' End-to-End')
    content = content.replace(' api gateway', ' API Gateway')
    content = content.replace(' database', ' Database')

    # Also check start of line or after parenthesis
    content = content.replace('(microservices', '(Microservices')
    content = content.replace('(frontend', '(Frontend')
    content = content.replace('(backend', '(Backend')

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")

print("Formatting complete.")
