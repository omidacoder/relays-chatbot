import re
import hashlib
from collections import Counter


# -----------------------------
# 1. Remove control characters
# -----------------------------
def remove_control_chars(text):
    # remove form feed and other strange PDF artifacts
    return re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', '', text)


# -----------------------------
# 2. Normalize whitespace
# -----------------------------
def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# -----------------------------
# 3. Remove file metadata header
# -----------------------------
def remove_file_metadata(text):
    patterns = [
        r'File Name:.*\n',
        r'File Path:.*\n',
        r'-{10,}\n'
    ]
    for p in patterns:
        text = re.sub(p, '', text)
    return text


# -----------------------------
# 4. Remove Table of Contents lines
# (lines with dot leaders)
# -----------------------------
def remove_dot_leader_lines(text):
    return "\n".join(
        line for line in text.split("\n")
        if not re.search(r'\.{5,}', line)
    )


# -----------------------------
# 5. Remove repeated headers/footers
# -----------------------------
def remove_repeated_lines(text, threshold=4):
    lines = [l.strip() for l in text.split("\n")]
    counts = Counter(lines)

    repeated = {
        line for line, count in counts.items()
        if count >= threshold and len(line) < 120
    }

    cleaned = [
        line for line in lines
        if line not in repeated
    ]

    return "\n".join(cleaned)


# -----------------------------
# 6. Remove page numbers
# -----------------------------
def remove_page_numbers(text):
    lines = text.split("\n")
    cleaned = []

    for line in lines:
        if re.fullmatch(r'\d+', line.strip()):
            continue
        cleaned.append(line)

    return "\n".join(cleaned)


# -----------------------------
# 7. Fix hyphenated words
# -----------------------------
def fix_hyphenation(text):
    return re.sub(r'-\n(\w+)', r'\1', text)


# -----------------------------
# 8. Join wrapped lines carefully
# -----------------------------
def join_wrapped_lines(text):
    # join lines that do not end with punctuation
    text = re.sub(r'(?<![.!?:;])\n(?!\n)', ' ', text)
    return text


# -----------------------------
# 9. Split paragraphs
# -----------------------------
def split_paragraphs(text):
    paragraphs = [p.strip() for p in text.split("\n\n")]
    return [p for p in paragraphs if p]


# -----------------------------
# 10. Deduplicate paragraphs
# -----------------------------
def deduplicate_paragraphs(paragraphs):
    seen = set()
    result = []

    for p in paragraphs:
        h = hashlib.md5(p.encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            result.append(p)

    return result


# -----------------------------
# 11. Quality filtering
# -----------------------------
def is_meaningful(paragraph):
    if len(paragraph) < 60:
        return False

    letters = sum(c.isalpha() for c in paragraph)
    if letters / max(len(paragraph), 1) < 0.5:
        return False

    return True


def filter_paragraphs(paragraphs):
    return [p for p in paragraphs if is_meaningful(p)]


# -----------------------------
# 12. Main pipeline
# -----------------------------
def clean_text(raw_text):
    text = remove_control_chars(raw_text)
    text = normalize_text(text)
    # text = remove_file_metadata(text)
    text = remove_dot_leader_lines(text)
    text = remove_page_numbers(text)
    text = remove_repeated_lines(text)
    text = fix_hyphenation(text)
    text = join_wrapped_lines(text)

    paragraphs = split_paragraphs(text)
    paragraphs = deduplicate_paragraphs(paragraphs)
    paragraphs = filter_paragraphs(paragraphs)

    return paragraphs


# -----------------------------
# 13. Save result
# -----------------------------
def save_text(paragraphs, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        for p in paragraphs:
            f.write(p + "\n\n")


# -----------------------------
# 14. Run
# -----------------------------
def process_file(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        raw_text = f.read()

    cleaned = clean_text(raw_text)
    save_text(cleaned, output_file)

    print(f"Kept {len(cleaned)} paragraphs")


if __name__ == "__main__":
    process_file("DSE_PD300.txt", "cleaned.txt")
