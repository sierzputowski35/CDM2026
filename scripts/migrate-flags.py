#!/usr/bin/env python3
"""Migre les drapeaux emoji Unicode vers codes ISO flagcdn.

Cible UNIQUEMENT les valeurs entre quotes simples qui sont
exactement un drapeau emoji régional (2 Regional Indicators)
ou un drapeau constitutif UK (gb-eng / gb-sct).

Usage : python scripts/migrate-flags.py file1 file2 ...
"""
import re
import sys
from pathlib import Path

# Drapeaux constitutifs UK (5 codepoints chacun)
SPECIAL_FLAGS = {
    '\U0001F3F4\U000E0067\U000E0062\U000E0065\U000E006E\U000E0067\U000E007F': 'gb-eng',  # Angleterre
    '\U0001F3F4\U000E0067\U000E0062\U000E0073\U000E0063\U000E0074\U000E007F': 'gb-sct',  # Écosse
    '\U0001F3F4\U000E0067\U000E0062\U000E0077\U000E006C\U000E0073\U000E007F': 'gb-wls',  # Pays de Galles
}

def regional_to_iso(emoji):
    """🇲🇽 → 'mx'. Returns None si pas un drapeau régional."""
    if len(emoji) != 2:
        return None
    cps = [ord(c) for c in emoji]
    if not all(0x1F1E6 <= cp <= 0x1F1FF for cp in cps):
        return None
    return ''.join(chr(cp - 0x1F1E6 + ord('a')) for cp in cps)

def replace_flag(match):
    """Remplace 'EMOJI_FLAG' par 'iso-code'."""
    inside = match.group(1)
    if inside in SPECIAL_FLAGS:
        return f"'{SPECIAL_FLAGS[inside]}'"
    code = regional_to_iso(inside)
    if code:
        return f"'{code}'"
    return match.group(0)  # pas un drapeau, on laisse

# Pattern : valeur entre quotes simples contenant 2 RI ou un drapeau UK
# RI = U+1F1E6 - U+1F1FF (4 octets UTF-8 chacun)
# Drapeau UK = 🏴 + tags (jusqu'à 6 tag chars + cancel)
# On match 'X' où X est l'un de :
#   - exactement 2 caractères dans la plage RI
#   - 🏴 suivi de tags jusqu'à un cancel tag
FLAG_PATTERN = re.compile(
    r"'("
    r"[\U0001F1E6-\U0001F1FF]{2}"  # drapeau régional (2 RIs)
    r"|"
    r"\U0001F3F4[\U000E0020-\U000E007F]+"  # drapeau UK constitutif
    r")'"
)

def migrate_file(path):
    p = Path(path)
    src = p.read_text(encoding='utf-8')
    new_src, n = FLAG_PATTERN.subn(replace_flag, src)
    if n > 0:
        p.write_text(new_src, encoding='utf-8')
        print(f"{path}: {n} drapeaux migrés")
    else:
        print(f"{path}: rien à migrer")
    return n

PAYS_PATTERN = re.compile(
    r"pays:'("
    r"[\U0001F1E6-\U0001F1FF]{2}"
    r"|"
    r"\U0001F3F4[\U000E0020-\U000E007F]+"
    r")\s+([^']+)'"
)

def strip_pays_emoji(match):
    """pays:'🇫🇷 France' → pays:'France'."""
    return f"pays:'{match.group(2)}'"

def migrate_pays(path):
    p = Path(path)
    src = p.read_text(encoding='utf-8')
    new_src, n = PAYS_PATTERN.subn(strip_pays_emoji, src)
    if n > 0:
        p.write_text(new_src, encoding='utf-8')
        print(f"{path}: {n} pays nettoyés (emoji retiré)")
    return n

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python migrate-flags.py file1 file2 ...")
        sys.exit(1)
    total = sum(migrate_file(f) for f in sys.argv[1:])
    for f in sys.argv[1:]:
        migrate_pays(f)
    print(f"\nTotal : {total} drapeaux migrés")
