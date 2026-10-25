#!/usr/bin/env bash
# Pulls every image from the live WordPress site into assets/img/.
# Run once from the repo root:  bash download-images.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/img
B="https://ievabagdonaviciute.com/wp-content/uploads"

while read -r src dst; do
  [ -z "$src" ] && continue
  echo "→ $dst"
  curl -sSfL "$B/$src" -o "assets/img/$dst"
done <<'EOF'
2024/10/nuotrauka-819x1024.jpg portrait.jpg
2025/08/Ieva-Bagdonaviciute-Microsoft-e1756327482507-1024x602.png microsoft.png
2025/08/scenario_animation-ezgif.com-video-to-gif-converter.gif physion.gif
2025/08/54737503-87BA-462B-A628-01F1D8E4A1AE.png abdomen-segmentation.png
2024/10/animation-2.gif pressure-field.gif
2024/10/swiss-1-1024x811.png ising-plot.png
2024/10/Group-1000006753.png plc-setup.png
2025/08/IMG_3920-1024x1014.jpg singing-1.jpg
2025/08/IMG_3922-1024x740.jpg singing-2.jpg
2025/08/IMG_3923-973x1024.jpg singing-3.jpg
2025/08/Ieva-Bagd-free-time-e1756329130100-1024x767.png hiking-1.png
2025/08/Ieva-Bagd-free-time-2-768x1024.png hiking-2.png
2025/08/DSC01231-683x1024.jpg hiking-3.jpg
2026/03/ricardo-gomez-angel-58uZCE8zrdk-unsplash.jpg blog-leadership.jpg
2026/03/ricardo-gomez-angel-58uZCE8zrdk-unsplash-1.jpg blog-leadership-hero.jpg
2026/03/tron-le-aAn-_iTks4E-unsplash.jpg blog-marketing.jpg
2024/10/nuotrauka-240x300.jpg portrait-240.jpg
2024/10/nuotrauka-768x960.jpg portrait-768.jpg
2024/10/nuotrauka-1229x1536.jpg portrait-1229.jpg
2024/10/nuotrauka-1638x2048.jpg portrait-1638.jpg
2024/10/nuotrauka-scaled.jpg portrait-2048.jpg
2025/08/Ieva-Bagdonaviciute-Microsoft-e1756327482507-300x176.png microsoft-300.png
2025/08/Ieva-Bagdonaviciute-Microsoft-e1756327482507-768x452.png microsoft-768.png
2025/08/Ieva-Bagdonaviciute-Microsoft-e1756327482507.png microsoft-1394.png
2025/08/54737503-87BA-462B-A628-01F1D8E4A1AE-300x150.png abdomen-segmentation-300.png
2025/08/54737503-87BA-462B-A628-01F1D8E4A1AE-768x385.png abdomen-segmentation-768.png
2024/10/swiss-1-300x238.png ising-plot-300.png
2024/10/swiss-1-768x608.png ising-plot-768.png
2024/10/swiss-1-1536x1217.png ising-plot-1536.png
2024/10/swiss-1-2048x1622.png ising-plot-2048.png
2024/10/swiss-1.png ising-plot-1920.png
2024/10/Group-1000006753-300x185.png plc-setup-300.png
2024/10/Group-1000006753-768x474.png plc-setup-768.png
2025/08/IMG_3920-300x297.jpg singing-1-300.jpg
2025/08/IMG_3920-150x150.jpg singing-1-150.jpg
2025/08/IMG_3920-768x760.jpg singing-1-768.jpg
2025/08/IMG_3920.jpg singing-1-1290.jpg
2025/08/IMG_3922-300x217.jpg singing-2-300.jpg
2025/08/IMG_3922-768x555.jpg singing-2-768.jpg
2025/08/IMG_3922.jpg singing-2-1290.jpg
2025/08/IMG_3923-285x300.jpg singing-3-285.jpg
2025/08/IMG_3923-768x808.jpg singing-3-768.jpg
2025/08/IMG_3923.jpg singing-3-1290.jpg
2025/08/Ieva-Bagd-free-time-e1756329130100-300x225.png hiking-1-300.png
2025/08/Ieva-Bagd-free-time-e1756329130100-768x575.png hiking-1-768.png
2025/08/Ieva-Bagd-free-time-e1756329130100.png hiking-1-1255.png
2025/08/Ieva-Bagd-free-time-2-225x300.png hiking-2-225.png
2025/08/Ieva-Bagd-free-time-2-1152x1536.png hiking-2-1152.png
2025/08/Ieva-Bagd-free-time-2.png hiking-2-1255.png
2025/08/DSC01231-200x300.jpg hiking-3-200.jpg
2025/08/DSC01231-768x1152.jpg hiking-3-768.jpg
2025/08/DSC01231-1024x1536.jpg hiking-3-1024.jpg
2025/08/DSC01231-1365x2048.jpg hiking-3-1365.jpg
2025/08/DSC01231-scaled.jpg hiking-3-1707.jpg
EOF

echo "Done — $(ls assets/img | wc -l | tr -d ' ') images in assets/img/"
