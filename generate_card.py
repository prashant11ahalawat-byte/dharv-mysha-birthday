import os
from PIL import Image, ImageDraw, ImageFont

def create_card():
    width = 1080
    height = 1440
    img = Image.new('RGB', (width, height), color='#12072b')
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(height):
        r = int(18 + (y / height) * 15)
        g = int(7 + (y / height) * 10)
        b = int(43 + (y / height) * 35)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Load system fonts
    font_path = '/System/Library/Fonts/HelveticaNeue.ttc'
    
    def get_font(size, index=0):
        try:
            return ImageFont.truetype(font_path, size, index=index)
        except:
            return ImageFont.load_default()

    font_heavy = get_font(56, 1)  # Bold
    font_title = get_font(68, 1)  # Bold Large
    font_kicker = get_font(26, 1)
    font_tagline = get_font(28, 2) # Italic or medium
    font_star_name = get_font(34, 1)
    font_star_num = get_font(52, 1)
    font_star_sub = get_font(22, 0)
    font_detail_label = get_font(22, 1)
    font_detail_val = get_font(28, 1)
    font_detail_sub = get_font(20, 0)
    font_body = get_font(24, 0)
    font_footer = get_font(26, 1)

    # Carnival Top Strip (PVR Playhouse colors: Red, Yellow, Blue, Orange, Pink)
    colors = ['#e11d48', '#ffc21a', '#2563eb', '#f97316', '#ec4899', '#10b981']
    strip_w = width // len(colors)
    for i, c in enumerate(colors):
        draw.rectangle([(i * strip_w, 0), ((i + 1) * strip_w, 16)], fill=c)

    # Decorative Border Frame
    margin = 36
    draw.rounded_rectangle(
        [(margin, margin + 10), (width - margin, height - margin)],
        radius=28,
        outline='#ffc21a',
        width=5
    )

    # Ticket Header Background
    draw.rounded_rectangle(
        [(margin + 6, margin + 16), (width - margin - 6, 320)],
        radius=22,
        fill='#230f4a',
        outline='#e8c360',
        width=2
    )

    # Kicker
    kicker_text = "★ SPECIAL PREMIERE INVITATION ★"
    draw.text((width // 2, 75), kicker_text, fill='#ffd43f', font=font_kicker, anchor='mm')

    # Main Headline
    draw.text((width // 2, 130), "YOU'RE INVITED TO A", fill='#ffffff', font=font_heavy, anchor='mm')
    
    # 3D Shadow for "MOVIE PARTY"
    mp_text = "MOVIE PARTY"
    for ox, oy in [(4, 4), (3, 3), (2, 2)]:
        draw.text((width // 2 + ox, 205 + oy), mp_text, fill='#9f1239', font=font_title, anchor='mm')
    draw.text((width // 2, 205), mp_text, fill='#ffc21a', font=font_title, anchor='mm')

    # Tagline
    tagline = '"Two birthdays, one big screen, and all the popcorn you can eat!"'
    draw.text((width // 2, 275), tagline, fill='#ffe4e6', font=font_tagline, anchor='mm')

    # -------------------------------------------------------------
    # Side-by-Side Birthday Stars Poster Cards
    # -------------------------------------------------------------
    card_top = 345
    card_h = 240
    col_w = (width - margin * 2 - 40) // 2
    left1 = margin + 15
    left2 = left1 + col_w + 10

    # Dharv Card (Blue)
    draw.rounded_rectangle(
        [(left1, card_top), (left1 + col_w, card_top + card_h)],
        radius=20,
        fill='#1e3a8a',
        outline='#60a5fa',
        width=4
    )
    # Circle badge 6
    badge_cx = left1 + col_w // 2
    badge_cy = card_top + 60
    draw.ellipse([(badge_cx - 45, badge_cy - 45), (badge_cx + 45, badge_cy + 45)], fill='#ffc21a', outline='#ffffff', width=3)
    draw.text((badge_cx, badge_cy + 2), "6", fill='#3b1e04', font=font_star_num, anchor='mm')
    draw.text((badge_cx, card_top + 135), "DHARV PRATAP", fill='#ffffff', font=font_star_name, anchor='mm')
    draw.text((badge_cx, card_top + 175), "Birthday Boy", fill='#fed7aa', font=font_star_sub, anchor='mm')
    draw.text((badge_cx, card_top + 205), "TURNING 6", fill='#ffffff', font=font_kicker, anchor='mm')

    # Mysha Card (Pink)
    draw.rounded_rectangle(
        [(left2, card_top), (left2 + col_w, card_top + card_h)],
        radius=20,
        fill='#be185d',
        outline='#f472b6',
        width=4
    )
    # Circle badge 9
    badge2_cx = left2 + col_w // 2
    badge2_cy = card_top + 60
    draw.ellipse([(badge2_cx - 45, badge2_cy - 45), (badge2_cx + 45, badge2_cy + 45)], fill='#ffc21a', outline='#ffffff', width=3)
    draw.text((badge2_cx, badge2_cy + 2), "9", fill='#3b1e04', font=font_star_num, anchor='mm')
    draw.text((badge2_cx, card_top + 135), "MYSHA", fill='#ffffff', font=font_star_name, anchor='mm')
    draw.text((badge2_cx, card_top + 175), "Birthday Girl", fill='#fed7aa', font=font_star_sub, anchor='mm')
    draw.text((badge2_cx, card_top + 205), "TURNING 9", fill='#ffffff', font=font_kicker, anchor='mm')

    # -------------------------------------------------------------
    # PVR Playhouse Feature Callout
    # -------------------------------------------------------------
    feat_top = 610
    draw.rounded_rectangle(
        [(margin + 15, feat_top), (width - margin - 15, feat_top + 95)],
        radius=16,
        fill='#e11d48',
        outline='#ffc21a',
        width=3
    )
    draw.text((width // 2, feat_top + 32), "★ PVR PLAYHOUSE THEATRE EXPERIENCE ★", fill='#ffd43f', font=font_kicker, anchor='mm')
    draw.text((width // 2, feat_top + 65), "In-Auditorium Giant Tube Slide • Warm Popcorn • Big Screen Fun!", fill='#ffffff', font=font_body, anchor='mm')

    # -------------------------------------------------------------
    # 2x2 Details Box
    # -------------------------------------------------------------
    det_top = 725
    det_h = 360
    draw.rounded_rectangle(
        [(margin + 15, det_top), (width - margin - 15, det_top + det_h)],
        radius=20,
        fill='#fffdf9',
        outline='#eed7b0',
        width=3
    )

    # Date
    draw.text((left1 + 15, det_top + 30), "DATE", fill='#8c5d0f', font=font_detail_label)
    draw.text((left1 + 15, det_top + 58), "Thursday, 10 December 2026", fill='#1e1534', font=font_detail_val)
    draw.text((left1 + 15, det_top + 92), "Mark your calendar for showtime!", fill='#6b7280', font=font_detail_sub)

    # Time
    draw.text((left2 + 15, det_top + 30), "TIME", fill='#8c5d0f', font=font_detail_label)
    draw.text((left2 + 15, det_top + 58), "4:30 – 7:30 PM", fill='#1e1534', font=font_detail_val)
    draw.text((left2 + 15, det_top + 92), "(Evening show & party)", fill='#6b7280', font=font_detail_sub)

    draw.line([(left1 + 15, det_top + 130), (width - margin - 30, det_top + 130)], fill='#e5e7eb', width=2)

    # Venue
    draw.text((left1 + 15, det_top + 150), "VENUE", fill='#8c5d0f', font=font_detail_label)
    draw.text((left1 + 15, det_top + 178), "PVR Cinemas (Playhouse), Forum Nexus Mall", fill='#1e1534', font=font_detail_val)
    draw.text((left1 + 15, det_top + 214), "4th Floor, Nexus Mall Koramangala, 21 Hosur Rd, Bengaluru", fill='#4b5563', font=font_detail_sub)
    draw.text((left1 + 15, det_top + 242), "🗺️ Maps: https://maps.app.goo.gl/pjCYpurdFAuU8U3UA", fill='#2563eb', font=font_detail_sub)

    # Fun Includes
    draw.text((left1 + 15, det_top + 280), "FUN INCLUDES", fill='#8c5d0f', font=font_detail_label)
    draw.text((left1 + 15, det_top + 308), "Slide & Popcorn • Private Kids' Cinema Experience", fill='#e11d48', font=font_detail_val)

    # -------------------------------------------------------------
    # Parents Note
    # -------------------------------------------------------------
    p_top = 1105
    draw.rounded_rectangle(
        [(margin + 15, p_top), (width - margin - 15, p_top + 115)],
        radius=16,
        fill='#fff7ed',
        outline='#ea580c',
        width=3
    )
    draw.text((width // 2, p_top + 38), "👨‍👩‍👧‍👦 PARENTS, PLEASE JOIN US!", fill='#9a3412', font=font_heavy, anchor='mm')
    draw.text((width // 2, p_top + 78), "Grown-ups are welcome too — bring the whole family and make it a movie night to remember.", fill='#7c2d12', font=font_body, anchor='mm')

    # -------------------------------------------------------------
    # Perforated Line & Ticket Stub Footer
    # -------------------------------------------------------------
    stub_top = 1240
    # Dashed line
    dash_y = stub_top - 5
    for x in range(margin + 20, width - margin - 20, 20):
        draw.line([(x, dash_y), (x + 10, dash_y)], fill='#baa485', width=3)

    # Cutout notches
    draw.ellipse([(margin - 12, dash_y - 20), (margin + 28, dash_y + 20)], fill='#12072b')
    draw.ellipse([(width - margin - 28, dash_y - 20), (width - margin + 12, dash_y + 20)], fill='#12072b')

    # Stub Box
    draw.rounded_rectangle(
        [(margin + 15, stub_top + 15), (width - margin - 15, height - margin - 15)],
        radius=18,
        fill='#2b1359',
        outline='#ffc21a',
        width=3
    )
    draw.text((width // 2, stub_top + 55), "ADMIT: THE WHOLE FAMILY", fill='#ffd43f', font=font_heavy, anchor='mm')
    draw.text((width // 2, stub_top + 105), "Please RSVP Online • Made with ♥ for Mysha & Dharv Pratap", fill='#ffffff', font=font_footer, anchor='mm')

    # Save image
    out_path = os.path.abspath('public/invitation-card.png')
    img.save(out_path, 'PNG', quality=95)
    print(f"✅ Generated high-resolution invitation card at: {out_path}")

if __name__ == '__main__':
    create_card()
