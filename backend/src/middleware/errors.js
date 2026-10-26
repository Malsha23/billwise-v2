export const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

// route එකක් ඇතුළේ එන ඕනෑම error එකක් අන්තිමට එන්නේ මෙතනට
export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first?.message || 'Invalid data' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
};