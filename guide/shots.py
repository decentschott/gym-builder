import asyncio, qrcode
from playwright.async_api import async_playwright
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
URL="file://"+os.path.join(os.path.dirname(HERE),"dist","index.html")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(**({"executable_path":os.environ["CHROME_PATH"]} if os.environ.get("CHROME_PATH") else {}))
    ctx=await b.new_context(viewport={"width":390,"height":700},device_scale_factor=2)
    await ctx.add_init_script("localStorage.setItem('gb_look', JSON.stringify({diagram:'whiteboard',team:'stluke',c1:'#1d3fa6',c2:'#f5c400',line:'hs'}))")
    pg=await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(300)
    # 1 gym sheet
    await pg.click("#gymBtn"); await pg.wait_for_timeout(400)
    await pg.screenshot(path="1_gym.png")
    await pg.click("#gdone")
    # 2 catalog with motion chip
    await pg.click("[data-cat='mot']"); await pg.wait_for_timeout(200); await pg.evaluate("window.scrollTo(0,150)")
    await pg.screenshot(path="2_drills.png")
    # 3 drill detail mid-animation
    await pg.click(".card[data-id='m1'] .cname"); await pg.wait_for_timeout(1500)
    await pg.screenshot(path="3_drill.png")
    await pg.click(".close")
    # 4 plan builder
    await pg.click("nav button[data-tab='plan']"); await pg.click('#len button[data-v="90"]'); await pg.click("[data-focus='mot']")
    await pg.screenshot(path="4_build.png")
    # 5 plan result
    await pg.click("[data-tpl='0']"); await pg.wait_for_timeout(2200)
    await pg.evaluate("window.scrollTo(0, document.querySelector('.plan').getBoundingClientRect().top + window.scrollY + 40)"); await pg.wait_for_timeout(200)
    await pg.screenshot(path="5_plan.png")
    # 6 print view
    await pg.evaluate("window.print=()=>{}")
    await pg.click("#pprint"); await pg.wait_for_timeout(300)
    await pg.screenshot(path="6_print.png")
    await b.close()
  qrcode.make("https://decentschott.github.io/gym-builder/",border=1).save("qr.png")
asyncio.run(main())
