import asyncio, os
HERE=os.path.dirname(os.path.abspath(__file__))
from playwright.async_api import async_playwright
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({"executable_path":os.environ["CHROME_PATH"]} if os.environ.get("CHROME_PATH") else {})); pg=await b.new_page()
    await pg.goto("file://"+os.path.join(HERE,"guide.html")); await pg.wait_for_timeout(400)
    await pg.pdf(path=os.path.join(os.path.dirname(HERE),"public","quick-start.pdf"),format="Letter",print_background=True,margin={"top":"0","bottom":"0","left":"0","right":"0"})
    await b.close()
asyncio.run(m())
