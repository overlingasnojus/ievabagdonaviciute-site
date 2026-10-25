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
EOF

echo "Done — $(ls assets/img | wc -l | tr -d ' ') images in assets/img/"
