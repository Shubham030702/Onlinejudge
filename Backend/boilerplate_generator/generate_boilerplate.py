import sys
from pathlib import Path

CPP_TYPES = {
    "int": "int",
    "float": "float",
    "string": "std::string",
    "bool": "bool",
    "list<int>": "vector<int>",
    "list<float>": "vector<float>",
    "list<string>": "vector<string>",
    "list<bool>": "vector<bool>",
}

JAVA_TYPES = {
    "int": "int",
    "float": "float",
    "string": "String",
    "bool": "boolean",
    "list<int>": "List<Integer>",
    "list<float>": "List<Float>",
    "list<string>": "List<String>",
    "list<bool>": "List<Boolean>",
}


class BoilerplateParser:
    """Base parser for Structure.md problem definitions."""

    def __init__(self) -> None:
        self.function_name: str = ""
        self.input_fields: list[str] = []
        self.input_fields_name: list[str] = []
        self.output_field: str = ""
        self.output_field_name: str = ""

    def parse(self, content: str) -> None:
        for line in content.splitlines():
            if line.startswith("Function Name :"):
                self.function_name = line.replace("Function Name :", "").strip()
            elif line.startswith("Input Field:"):
                parts = line.replace("Input Field:", "").strip().split(" ")
                self.input_fields.append(parts[0])
                self.input_fields_name.append(parts[1])
            elif line.startswith("Output Field:"):
                parts = line.replace("Output Field:", "").strip().split(" ")
                self.output_field = parts[0]
                self.output_field_name = parts[1]


class GenerateBoilerplate(BoilerplateParser):
    """Generates user-facing starter boilerplate code."""

    def boilerplate_cpp(self) -> str:
        inputs = ", ".join(
            f"{CPP_TYPES.get(f, 'unknown')} {name}"
            for f, name in zip(self.input_fields, self.input_fields_name)
        )
        ret_type = CPP_TYPES.get(self.output_field, "unknown")
        return f"{ret_type} {self.function_name}({inputs}) {{\n //Write your code here \n}}"

    def boilerplate_js(self) -> str:
        inputs = ", ".join(self.input_fields_name)
        return f"function {self.function_name}({inputs}) {{\n //Write your code here \n}}"

    def boilerplate_python(self) -> str:
        inputs = ", ".join(self.input_fields_name)
        return f"def {self.function_name}({inputs}) : \n \t #Write your code here \n "

    def boilerplate_java(self) -> str:
        inputs = ", ".join(
            f"{JAVA_TYPES.get(f, 'Object')} {name}"
            for f, name in zip(self.input_fields, self.input_fields_name)
        )
        ret_type = JAVA_TYPES.get(self.output_field, "Object")
        return f"public static {ret_type} {self.function_name}({inputs}) {{\n    // Implementation goes here \n}}"


class FullBoilerplate(BoilerplateParser):
    """Generates full harness boilerplate code for Judge0 execution."""

    def generate_cpp(self) -> str:
        inp_lines = []
        for f, name in zip(self.input_fields, self.input_fields_name):
            cpp_t = CPP_TYPES.get(f, "unknown").replace("std::", "")
            if f.startswith("list<"):
                inp_lines.append(
                    f"int size_{name};\ncin>>size_{name};\n{cpp_t} {name}(size_{name});\n"
                    f"for(int i=0;i<size_{name};i++){{\n cin>>{name}[i]; \n}}"
                )
            else:
                inp_lines.append(f"{cpp_t} {name};\ncin>>{name};")
        inp_block = "\n".join(inp_lines)
        ret_type = CPP_TYPES.get(self.output_field, "unknown").replace("std::", "")
        fn_call = f"{ret_type} {self.output_field_name} = {self.function_name}({','.join(self.input_fields_name)});"
        out_block = (
            f'for(int i=0;i<{self.output_field_name}.size();i++){{\n cout<<{self.output_field_name}[i]<<" "; \n }}'
            if self.output_field.startswith("list<")
            else f"cout<<{self.output_field_name}<<endl;"
        )
        return f"""
#include <bits/stdc++.h>

using namespace std;

## Enter Code Here ##

int main() {{
    {inp_block}
    {fn_call}
    {out_block}
    return 0;
}}
"""

    def generate_js(self) -> str:
        inp_lines = []
        for f, name in zip(self.input_fields, self.input_fields_name):
            if f.startswith("list<"):
                inp_lines.append(
                    f"const size_{name} = parseInt(prompt()); \n"
                    f"            const {name} = [];\n"
                    f"            for (let i = 0; i < size_{name}; i++) {{\n"
                    f"                {name}.push(parseInt(prompt()));\n"
                    f"            }}"
                )
            else:
                inp_lines.append(f"const {name} = parseInt(prompt());")
        inp_block = "\n".join(inp_lines)
        fn_call = f"const {self.output_field_name} = {self.function_name}({', '.join(self.input_fields_name)});"
        out_block = (
            f"{self.output_field_name}.forEach(x => console.log(x));"
            if self.output_field.startswith("list<")
            else f"console.log({self.output_field_name});"
        )
        return f"""
## Enter Code Here ##
{inp_block}
{fn_call}
{out_block}
"""

    def generate_java(self) -> str:
        inp_lines = []
        for f, name in zip(self.input_fields, self.input_fields_name):
            j_type = JAVA_TYPES.get(f, "Object")
            if f.startswith("list<"):
                inp_lines.append(
                    f"int size_{name};\n"
                    f"                Scanner sc = new Scanner(System.in);\n"
                    f"                size_{name} = sc.nextInt();\n"
                    f"                {j_type} {name} = new {j_type}(size_{name});\n"
                    f"                for(int i=0;i<size_{name};i++){{\n"
                    f"                    {name}[i] = sc.nextInt();\n"
                    f"                }}"
                )
            else:
                inp_lines.append(f"{j_type} {name} = sc.nextInt();")
        inp_block = "\n".join(inp_lines)
        ret_type = JAVA_TYPES.get(self.output_field, "Object")
        fn_call = f"{ret_type} {self.output_field_name} = {self.function_name}({','.join(self.input_fields_name)});"
        out_block = (
            f'for(int i=0;i<{self.output_field_name}.size();i++){{\n System.out.print({self.output_field_name}[i]+" "); \n }}'
            if self.output_field.startswith("list<")
            else f"System.out.println({self.output_field_name});"
        )
        return f"""
import java.util.*;

## Enter Code Here ##

public class Main {{
    public static void main(String[] args) {{
        Scanner sc = new Scanner(System.in);
        {inp_block}
        {fn_call}
        {out_block}
    }}
}}
"""

    def generate_python(self) -> str:
        inp_lines = []
        for f, name in zip(self.input_fields, self.input_fields_name):
            if f.startswith("list<"):
                inp_lines.append(
                    f"size_{name} = int(input())\n{name} = []\nfor i in range(size_{name}):\n\t{name}.append(int(input()))"
                )
            else:
                inp_lines.append(f"{name} = int(input())")
        inp_block = "\n".join(inp_lines)
        fn_call = f"{self.output_field_name} = {self.function_name}({','.join(self.input_fields_name)})"
        out_block = (
            f'for i in range(len({self.output_field_name})):\n    print({self.output_field_name}[i], end=" ")'
            if self.output_field.startswith("list<")
            else f"print({self.output_field_name})"
        )
        return f"""
## Enter Code Here ##   
{inp_block}
{fn_call}
{out_block}
"""


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python -m boilerplate_generator.generate_boilerplate <problem_dir>")
        sys.exit(1)

    problem_dir = Path(sys.argv[1])
    content = (problem_dir / "Structure.md").read_text(encoding="utf-8")

    gen1 = GenerateBoilerplate()
    gen2 = FullBoilerplate()
    gen1.parse(content)
    gen2.parse(content)

    bp_dir = problem_dir / "BoilerPlate"
    bp_full_dir = problem_dir / "BoilerPlateFull"
    bp_dir.mkdir(exist_ok=True)
    bp_full_dir.mkdir(exist_ok=True)

    (bp_dir / "boilerplate.cpp").write_text(gen1.boilerplate_cpp(), encoding="utf-8")
    (bp_dir / "boilerplate.py").write_text(gen1.boilerplate_python(), encoding="utf-8")
    (bp_dir / "boilerplate.java").write_text(gen1.boilerplate_java(), encoding="utf-8")
    (bp_dir / "boilerplate.js").write_text(gen1.boilerplate_js(), encoding="utf-8")

    (bp_full_dir / "boilerplate.cpp").write_text(gen2.generate_cpp(), encoding="utf-8")
    (bp_full_dir / "boilerplate.js").write_text(gen2.generate_js(), encoding="utf-8")
    (bp_full_dir / "boilerplate.java").write_text(gen2.generate_java(), encoding="utf-8")
    (bp_full_dir / "boilerplate.py").write_text(gen2.generate_python(), encoding="utf-8")

    print("Boilerplate files generated successfully!")


if __name__ == "__main__":
    main()
