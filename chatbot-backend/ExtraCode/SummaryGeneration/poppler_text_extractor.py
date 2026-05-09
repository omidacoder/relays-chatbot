from pathlib import Path
from tqdm import tqdm
import subprocess


def get_unique_txt_path(output_dir: Path, base_name: str) -> Path:
    """
    Returns a unique file path inside output_dir.
    If base_name.txt exists, appends _1, _2, etc.
    """
    txt_path = output_dir / f"{base_name}.txt"

    if not txt_path.exists():
        return txt_path

    counter = 1
    while True:
        new_path = output_dir / f"{base_name}_{counter}.txt"
        if not new_path.exists():
            return new_path
        counter += 1


def extract_pdfs_to_txt(root_dir: Path):

    root_dir = root_dir.resolve()
    # This is the folder containing the extracted text
    output_dir = root_dir / "extracted_results" / "extracted_txt_files"
    output_dir.mkdir(parents=True, exist_ok=True)

    # This is the file where we list PDFs that had no text
    scanned_log_path = root_dir / "extracted_results"  / "scanned_pdfs.txt"

    pdf_files = list(root_dir.rglob("*.pdf"))

    processed = 0
    no_text_files = []
    syntax_error_files = []

    for pdf_path in tqdm(pdf_files, desc="Processing PDFs"):

        pdf_path = pdf_path.resolve()
        relative_path = pdf_path.relative_to(root_dir)

        try:
            result = subprocess.run(
                ["pdftotext", "-layout", str(pdf_path), "-"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
        except Exception:
            syntax_error_files.append(str(relative_path))
            continue

        if result.returncode != 0:
            syntax_error_files.append(str(relative_path))
            continue

        full_text = result.stdout.decode("utf-8", errors="ignore")

        if full_text.strip():
            header = (
                f"File Name: {pdf_path.name}\n"
                f"File Path: {relative_path}\n"
                f"{'-'*60}\n\n"
            )

            base_name = pdf_path.stem
            txt_path = get_unique_txt_path(output_dir, base_name)

            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(header + full_text)

            processed += 1
        else:
            # Add to the list of files with no text
            no_text_files.append(str(relative_path))

    # --- NEW BLOCK: Write the scanned/empty PDFs to a text file ---
    if no_text_files:
        with open(scanned_log_path, "w", encoding="utf-8") as f:
            for filename in no_text_files:
                f.write(f"{filename}\n")
        print(f"\nList of PDFs with no text saved to: {scanned_log_path}")
    # ---------------------------------------------------------------

    print("\nFinished")
    print(f"PDFs converted to TXT: {processed}")

    print(f"\nPDFs with pdftotext error ({len(syntax_error_files)}):")
    for f in syntax_error_files:
        print(f" - {f}")

    print(f"\nPDFs with no extractable text ({len(no_text_files)}):")
    for f in no_text_files:
        print(f" - {f}")


PDF_ROOT = Path.cwd()
extract_pdfs_to_txt(PDF_ROOT)