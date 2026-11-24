import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_super_card():
    width = 1080
    height = 1440
    
    # 1. Base Image & Radial Gradient (Deep Midnight Twilight)
    base = Image.new('RGB', (width, height), color='#0d0622')
    draw = ImageDraw.Draw(base)

    # Rich radial lighting
    for y in range(height):
        ratio = y / height
        # Indigo to deep purple gradient
        r = int(18 + 25 * math.sin(ratio * math.pi))
        g = int(8 + 12 * math.sin(ratio * math.pi))
        b = int(45 + 40 * math.sin(ratio * math.pi))
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Add soft festive confetti polka-dots in background (inspired by PVR Playhouse wall & carpet)
    import random
    random.seed(42)  # consistent beautiful layout
    for _ in range(70):
        cx = random.randint(30, width - 30)
        cy = random.randint(30, height - 30)
        radius = random.randint(4, 12)
        dot_color = random.choice([
            (255, 194, 26, 40),  # Yellow
            (225, 29, 72, 40),   # Red/Pink
            (37, 99, 235, 40),   # Blue
            (249, 115, 22, 40),  # Orange
            (16, 185, 129, 40)   # Teal
        ])
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=dot_color[:3])

    # 2. Outer Cinema Marquee Frame with Glowing Lightbulbs
    frame_m = 28
    draw.rounded_rectangle(
        [(frame_m, frame_m), (width - frame_m, height - frame_m)],
        radius=30,
        outline='#d4af37',
        width=4
    )
    inner_m = 38
    draw.rounded_rectangle(
        [(inner_m, inner_m), (width - inner_m, height - inner_m)],
        radius=24,
        outline='#ffc21a',
        width=2
    )

    # Draw marquee bulbs around the perimeter
    bulb_spacing = 38
    # Top & Bottom bulbs
    for x in range(inner_m + 30, width - inner_m - 20, bulb_spacing):
        for y in [inner_m + 12, height - inner_m - 12]:
            # Glow halo
            draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill='#5a4405')
            draw.ellipse([x - 5, y - 5, x + 5, y + 5], fill='#ffd54f')
            draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill='#ffffff')

    # Left & Right bulbs
    for y in range(inner_m + 40, height - inner_m - 30, bulb_spacing):
        for x in [inner_m + 12, width - inner_m - 12]:
            draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill='#5a4405')
            draw.ellipse([x - 5, y - 5, x + 5, y + 5], fill='#ffd54f')
            draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill='#ffffff')

    # 3. Main Ticket Card Canvas
    ticket_left = 65
    ticket_top = 65
    ticket_right = width - 65
    ticket_bottom = height - 65
    
    # Cream paper background
    draw.rounded_rectangle(
        [(ticket_left, ticket_top), (ticket_right, ticket_bottom)],
        radius=20,
        fill='#fffcf5',
        outline='#ecd09b',
        width=3
    )

    # Load system fonts
    font_path = '/System/Library/Fonts/HelveticaNeue.ttc'
    def get_font(size, index=1):
        try:
            return ImageFont.truetype(font_path, size, index=index)
        except:
            return ImageFont.load_default()

    font_kicker = get_font(24, 1)
    font_sub_kicker = get_font(30, 1)
    font_title = get_font(74, 1)
    font_tagline = get_font(26, 2)
    font_star_name = get_font(34, 1)
    font_star_num = get_font(56, 1)
    font_star_sub = get_font(21, 0)
    font_star_turn = get_font(22, 1)
    font_badge_title = get_font(24, 1)
    font_detail_label = get_font(20, 1)
    font_detail_val = get_font(28, 1)
    font_detail_sub = get_font(20, 0)
    font_parents_h = get_font(30, 1)
    font_parents_b = get_font(22, 0)
    font_stub_h = get_font(36, 1)
    font_stub_sub = get_font(24, 1)

    # 4. Header Band: Cinema Theatre Marquee
    header_h = 240
    draw.rounded_rectangle(
        [(ticket_left + 4, ticket_top + 4), (ticket_right - 4, ticket_top + header_h)],
        radius=16,
        fill='#200a45'
    )
    # Carnival striped accent on top
    strip_colors = ['#e11d48', '#ffc21a', '#2563eb', '#f97316', '#ec4899', '#06b6d4']
    cw = (ticket_right - ticket_left - 8) // len(strip_colors)
    for i, c in enumerate(strip_colors):
        draw.rectangle([(ticket_left + 4 + i * cw, ticket_top + 4), (ticket_left + 4 + (i + 1) * cw, ticket_top + 16)], fill=c)

    # Kicker Ribbon
    ribbon_w = 540
    ribbon_h = 36
    rx1 = (width - ribbon_w) // 2
    ry1 = ticket_top + 30
    draw.rounded_rectangle([(rx1, ry1), (rx1 + ribbon_w, ry1 + ribbon_h)], radius=18, fill='#401878', outline='#ffc21a', width=2)
    draw.text((width // 2, ry1 + 18), "🔔  MOVIE PARTY REMINDER • SHOWTIME SOON  🍿", fill='#ffd54f', font=font_kicker, anchor='mm')

    # "YOU'RE INVITED TO A"
    draw.text((width // 2, ticket_top + 98), "YOU'RE INVITED TO A", fill='#ffffff', font=font_sub_kicker, anchor='mm')

    # "MOVIE PARTY" layered gold 3D typography
    mp_y = ticket_top + 160
    # Deep shadow layers
    for off in [(6, 6), (5, 5), (4, 4), (3, 3), (2, 2)]:
        draw.text((width // 2 + off[0], mp_y + off[1]), "MOVIE PARTY", fill='#881337', font=font_title, anchor='mm')
    # Bright Gold Front
    draw.text((width // 2, mp_y), "MOVIE PARTY", fill='#ffc21a', font=font_title, anchor='mm')

    # Tagline
    tagline_y = ticket_top + 218
    draw.text((width // 2, tagline_y), '"Two birthdays, one big screen, and all the popcorn you can eat!"', fill='#ffe4e6', font=font_tagline, anchor='mm')

    # 5. Side-by-Side Birthday Stars Poster Cards
    stars_top = ticket_top + header_h + 24
    star_card_h = 240
    star_card_w = (ticket_right - ticket_left - 48) // 2
    sc_left1 = ticket_left + 18
    sc_left2 = sc_left1 + star_card_w + 12

    # --- DHARV PRATAP (SUPERHERO BLUE) ---
    draw.rounded_rectangle(
        [(sc_left1, stars_top), (sc_left1 + star_card_w, stars_top + star_card_h)],
        radius=20,
        fill='#1d4ed8',
        outline='#60a5fa',
        width=4
    )
    # Star 6 circular gold badge
    b1_cx = sc_left1 + star_card_w // 2
    b1_cy = stars_top + 58
    # Outer gold shadow & rim
    draw.ellipse([b1_cx - 46, b1_cy - 46, b1_cx + 46, b1_cy + 46], fill='#b45309')
    draw.ellipse([b1_cx - 43, b1_cy - 43, b1_cx + 43, b1_cy + 43], fill='#ffc21a', outline='#ffffff', width=3)
    # Specular shine
    draw.ellipse([b1_cx - 32, b1_cy - 38, b1_cx + 10, b1_cy - 12], fill='#fff9db')
    draw.text((b1_cx, b1_cy + 2), "6", fill='#3b1e04', font=font_star_num, anchor='mm')

    draw.text((b1_cx, stars_top + 130), "DHARV PRATAP", fill='#ffffff', font=font_star_name, anchor='mm')
    draw.text((b1_cx, stars_top + 168), "Birthday Boy", fill='#fed7aa', font=font_star_sub, anchor='mm')
    
    # Pill "TURNING 6"
    draw.rounded_rectangle([(b1_cx - 80, stars_top + 192), (b1_cx + 80, stars_top + 222)], radius=15, fill='#172554', outline='#93c5fd', width=2)
    draw.text((b1_cx, stars_top + 207), "TURNING 6", fill='#ffffff', font=font_star_turn, anchor='mm')

    # --- MYSHA (STARLET CANDY PINK) ---
    draw.rounded_rectangle(
        [(sc_left2, stars_top), (sc_left2 + star_card_w, stars_top + star_card_h)],
        radius=20,
        fill='#db2777',
        outline='#f472b6',
        width=4
    )
    b2_cx = sc_left2 + star_card_w // 2
    b2_cy = stars_top + 58
    draw.ellipse([b2_cx - 46, b2_cy - 46, b2_cx + 46, b2_cy + 46], fill='#b45309')
    draw.ellipse([b2_cx - 43, b2_cy - 43, b2_cx + 43, b2_cy + 43], fill='#ffc21a', outline='#ffffff', width=3)
    draw.ellipse([b2_cx - 32, b2_cy - 38, b2_cx + 10, b2_cy - 12], fill='#fff9db')
    draw.text((b2_cx, b2_cy + 2), "9", fill='#3b1e04', font=font_star_num, anchor='mm')

    draw.text((b2_cx, stars_top + 130), "MYSHA", fill='#ffffff', font=font_star_name, anchor='mm')
    draw.text((b2_cx, stars_top + 168), "Birthday Girl", fill='#fed7aa', font=font_star_sub, anchor='mm')

    draw.rounded_rectangle([(b2_cx - 80, stars_top + 192), (b2_cx + 80, stars_top + 222)], radius=15, fill='#831843', outline='#fbcfe8', width=2)
    draw.text((b2_cx, stars_top + 207), "TURNING 9", fill='#ffffff', font=font_star_turn, anchor='mm')

    # 6. PVR Playhouse Feature Banner (The Auditorium with the In-Theatre Slide)
    playhouse_top = stars_top + star_card_h + 20
    playhouse_h = 105
    draw.rounded_rectangle(
        [(ticket_left + 18, playhouse_top), (ticket_right - 18, playhouse_top + playhouse_h)],
        radius=18,
        fill='#e11d48',
        outline='#ffc21a',
        width=3
    )
    # Small badge
    draw.rounded_rectangle([(width // 2 - 190, playhouse_top + 12), (width // 2 + 190, playhouse_top + 38)], radius=12, fill='#ffc21a')
    draw.text((width // 2, playhouse_top + 25), "⭐ PVR PLAYHOUSE THEATRE ⭐", fill='#881337', font=font_badge_title, anchor='mm')
    draw.text((width // 2, playhouse_top + 58), "Featuring the Giant In-Auditorium Tube Slide & Endless Popcorn!", fill='#ffffff', font=font_star_turn, anchor='mm')
    draw.text((width // 2, playhouse_top + 84), "🛝 Spiral Slide  •  🍿 Warm Popcorn  •  🎬 Big Screen Magic  •  🎂 Cake Fun", fill='#ffedd5', font=font_star_sub, anchor='mm')

    # 7. Event Details Card (2x2 Grid)
    det_top = playhouse_top + playhouse_h + 18
    det_h = 295
    draw.rounded_rectangle(
        [(ticket_left + 18, det_top), (ticket_right - 18, det_top + det_h)],
        radius=18,
        fill='#ffffff',
        outline='#ecd7b7',
        width=3
    )

    # Date Block (Left)
    d_x = ticket_left + 36
    draw.text((d_x, det_top + 22), "📅  DATE", fill='#8c5d0f', font=font_detail_label)
    draw.text((d_x, det_top + 50), "Thursday, 10 December 2026", fill='#1e1534', font=font_detail_val)
    draw.text((d_x, det_top + 84), "Mark your calendar for showtime!", fill='#6b7280', font=font_detail_sub)

    # Time Block (Right)
    t_x = sc_left2 + 10
    draw.text((t_x, det_top + 22), "⏰  TIME", fill='#8c5d0f', font=font_detail_label)
    draw.text((t_x, det_top + 50), "4:30 – 7:30 PM", fill='#1e1534', font=font_detail_val)
    draw.text((t_x, det_top + 84), "Evening show with movie & party", fill='#6b7280', font=font_detail_sub)

    # Divider line
    draw.line([(ticket_left + 36, det_top + 118), (ticket_right - 36, det_top + 118)], fill='#f3f4f6', width=2)

    # Venue Block (Left)
    draw.text((d_x, det_top + 132), "📍  VENUE", fill='#8c5d0f', font=font_detail_label)
    draw.text((d_x, det_top + 158), "PVR Cinemas (Playhouse), Forum Nexus Mall", fill='#1e1534', font=font_detail_val)
    draw.text((d_x, det_top + 192), "4th Floor, Nexus Mall Koramangala, 21 Hosur Rd, Bengaluru", fill='#4b5563', font=font_detail_sub)
    draw.text((d_x, det_top + 218), "🗺️ Google Maps: https://maps.app.goo.gl/pjCYpurdFAuU8U3UA", fill='#2563eb', font=font_detail_sub)

    # Fun Includes (Bottom bar)
    draw.rounded_rectangle([(d_x, det_top + 248), (ticket_right - 36, det_top + 282)], radius=10, fill='#fff1f2', outline='#fecdd3', width=1)
    draw.text((width // 2, det_top + 265), "🍿 FUN INCLUDES: In-Theatre Slide & Popcorn Kids' Party! 🛝", fill='#be123c', font=font_star_turn, anchor='mm')

    # 8. Parents Note Callout
    p_top = det_top + det_h + 16
    p_h = 88
    draw.rounded_rectangle(
        [(ticket_left + 18, p_top), (ticket_right - 18, p_top + p_h)],
        radius=16,
        fill='#fff7ed',
        outline='#ea580c',
        width=3
    )
    draw.text((width // 2, p_top + 28), "👨‍👩‍👧‍👦  PARENTS, PLEASE JOIN US!", fill='#9a3412', font=font_parents_h, anchor='mm')
    draw.text((width // 2, p_top + 60), "Grown-ups are welcome too — bring the whole family and make it a movie night to remember.", fill='#7c2d12', font=font_parents_b, anchor='mm')

    # 9. Ticket Perforation & Tear Notch
    tear_y = p_top + p_h + 14
    for x in range(ticket_left + 15, ticket_right - 15, 20):
        draw.line([(x, tear_y), (x + 10, tear_y)], fill='#baa485', width=3)

    # Perforation side notches
    draw.ellipse([ticket_left - 16, tear_y - 18, ticket_left + 18, tear_y + 18], fill='#0d0622')
    draw.ellipse([ticket_right - 18, tear_y - 18, ticket_right + 16, tear_y + 18], fill='#0d0622')

    # 10. Ticket Stub / Reminder Banner
    stub_top = tear_y + 12
    stub_h = 100
    draw.rounded_rectangle(
        [(ticket_left + 18, stub_top), (ticket_right - 18, stub_top + stub_h)],
        radius=16,
        fill='#fef08a',
        outline='#ca8a04',
        width=3
    )
    draw.text((width // 2, stub_top + 28), "🔔  PARTY REMINDER  🔔", fill='#854d0e', font=font_badge_title, anchor='mm')
    draw.text((width // 2, stub_top + 58), "Make sure to RSVP on the shared link!", fill='#1e1534', font=font_detail_val, anchor='mm')
    draw.text((width // 2, stub_top + 84), "Reserve your family's seats & popcorn! • Made with ♥ for Mysha & Dharv", fill='#713f12', font=font_star_sub, anchor='mm')

    # Save to public and artifact folders
    out_path = os.path.abspath('public/invitation-card.png')
    base.save(out_path, 'PNG', quality=95)

    art_path = '/Users/prashantahalawat/.gemini/antigravity/brain/0ba9f3d6-a6e1-420e-aef6-10afe1c8f07a/invitation-card.png'
    base.save(art_path, 'PNG', quality=95)

    print(f"✅ Generated upgraded cinema invitation card at: {out_path}")

if __name__ == '__main__':
    create_super_card()
