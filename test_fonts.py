import pyfiglet

for font in ['cybermedium', 'cybersmall', 'cyberlarge', 'ansi_shadow', 'ansiregular', 'ansishadow']:
    try:
        print(f"Font: {font}")
        print(pyfiglet.Figlet(font=font).renderText('opencode'))
    except Exception:
        pass
