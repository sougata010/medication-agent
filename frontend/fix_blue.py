import os

directory = r'c:\Users\souga\Project-Own\lang-graph\med\frontend\src\pages'

replacements = {
    'fill-blue-500': 'fill-gray-600',
    'stroke="#3b82f6"': 'stroke="#111827"',
    'rgba(59, 130, 246, 0.2)': 'rgba(17, 24, 39, 0.1)',
    'bg-medical-50': 'bg-gray-50/50',
    'bg-medical-900': 'bg-black',
    'bg-blue-800/40': 'bg-white/10',
    'bg-blue-800/60': 'bg-white/20',
    'border-blue-700/30': 'border-white/10',
    'text-blue-200': 'text-gray-300',
    'text-blue-300': 'text-gray-400',
    'text-blue-400': 'text-gray-500',
    'text-blue-500': 'text-gray-600',
    'border-blue-50': 'border-gray-50',
    'border-blue-100': 'border-gray-100',
    'bg-blue-700': 'bg-black',
}

for filename in os.listdir(directory):
    if filename.endswith('.jsx') and filename not in ['LandingPage.jsx', 'LoginPage.jsx']:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {filename}')
