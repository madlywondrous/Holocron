import urllib.request

try:
    import pyfiglet
except ImportError:
    import os
    os.system('pip install pyfiglet')
    import pyfiglet

urllib.request.urlretrieve("https://raw.githubusercontent.com/xero/figlet-fonts/master/block.flf", "block.flf")

f = pyfiglet.Figlet(font='block.flf')
print(f.renderText('HOLOCRON'))
