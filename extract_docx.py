import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for p in tree.findall('.//w:p', namespace):
            texts = [node.text for node in p.findall('.//w:t', namespace) if node.text]
            if texts:
                paragraphs.append("".join(texts))
        
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {e}"

docx_path = r"c:\Sarisa-projects\plexonics\Plexonics_strapi.docx"
text = extract_text(docx_path)
import sys
sys.stdout.reconfigure(encoding='utf-8')
print(text)
