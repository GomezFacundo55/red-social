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

  it('leaves unrelated image URLs unchanged', () => {
    const external = 'https://images.example.com/avatar.png';
    expect(pipe.transform(external)).toBe(external);
    expect(pipe.transform(null)).toBe('');
  });
});
