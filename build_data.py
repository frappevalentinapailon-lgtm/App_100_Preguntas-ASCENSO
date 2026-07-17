import os
import re
import json

def main():
    with open("F:\\Z ASCENSO\\aligned_data.json", 'r', encoding='utf-8') as f:
        qas = json.load(f)

    out_dir = "F:\\Z ASCENSO\\App_Preguntas"
    os.makedirs(out_dir, exist_ok=True)
    
    # Save as data.js
    with open(os.path.join(out_dir, 'data.js'), 'w', encoding='utf-8') as f:
        f.write("const window_data = ")
        f.write(json.dumps(qas, indent=2, ensure_ascii=False))
        f.write(";\n")

    print(f"Successfully generated {len(qas)} questions into data.js.")

if __name__ == "__main__":
    main()
