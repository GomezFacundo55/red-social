import { UrlImagenPipe } from './url-imagen.pipe';
import { environment } from '../../environments/environment';

describe('UrlImagenPipe', () => {
  const pipe = new UrlImagenPipe();
  const api = environment.apiUrl.replace(/\/+$/, '');
  const id = '507f1f77bcf86cd799439011';

  it('resolves a relative image path against the configured API', () => {
    expect(pipe.transform(`/users/imagen/${id}`)).toBe(`${api}/users/imagen/${id}`);
  });

  it('normalizes image paths saved with an old host or query string', () => {
    expect(pipe.transform(`http://localhost:3000/users/imagen/${id}?v=1`)).toBe(
      `${api}/users/imagen/${id}`,
    );
  });

  it('normalizes legacy upload URLs to frontend static assets', () => {
    const filename = 'c53dcae9-42b3-4f1d-a404-e3610b0038b3.jpg';
    expect(pipe.transform(`http://localhost:3000/uploads/${filename}`)).toBe(
      `/uploads/${filename}`,
    );
  });

  it('leaves unrelated image URLs unchanged', () => {
    const external = 'https://images.example.com/avatar.png';
    expect(pipe.transform(external)).toBe(external);
    expect(pipe.transform(null)).toBe('');
  });
});
