export function generateStickmanPositions(users, existing = []) {
  if (!users || users.length === 0 || existing.length > 0) return existing;
  const positions = [];
  const usedPositions = [];
  users.slice(0, 8).forEach((user) => {
    let attempts = 0;
    let x, y;
    do {
      x = 100 + Math.random() * 800;
      const normalizedX = (x - 100) / 800;
      const domeCurveY = 200 - (normalizedX * (1 - normalizedX) * 270);
      const minY = domeCurveY - 50;
      const maxY = 180;
      y = minY + Math.random() * (maxY - minY);
      attempts++;
    } while (attempts < 50 && usedPositions.some(pos => Math.abs(pos.x - x) < 60 && Math.abs(pos.y - y) < 40));
    usedPositions.push({ x, y });
    positions.push({ x, y, user });
  });
  return positions;
}
