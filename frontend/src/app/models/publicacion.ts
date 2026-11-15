export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  imagenPerfil: string;
}

export interface Comentario {
  autor: AutorPublicacion | string;
  texto: string;
  fecha: string;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  autor: AutorPublicacion;
  meGusta: string[];
  cantidadMeGusta: number;
  comentarios: Comentario[];
  createdAt: string;
}

export interface PaginaPublicaciones {
  items: Publicacion[];
  total: number;
  offset: number;
  limit: number;
}

export type Orden = 'fecha' | 'meGusta';