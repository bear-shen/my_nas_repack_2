import type { api_file_list_resp } from '../Api';

export default {
  path: [
    {
      id: 1,
      title: 'this is title',
      description: 'cover',
      type: 'directory',
      is_file: 0,
      is_fav: 1,
      status: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 2,
      title: 'this is title',
      description: 'no cover',
      type: 'directory',
      status: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
    },],
  list: [
    //--- directory ---
    {
      id: 1,
      title: 'this is title',
      description: 'cover',
      type: 'directory',
      is_file: 0,
      is_fav: 1,
      status: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 2,
      title: 'this is title',
      description: 'no cover',
      type: 'directory',
      is_file: 0,
      is_fav: 0,
      status: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 3,
      title: 'this is title',
      description: 'no cover, tag',
      type: 'directory',
      is_file: 0,
      is_fav: 0,
      status: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
      tag: [
        {
          id: 1, title: 'language',
          sub: [
            { id: 1, title: 'chinese', },
          ],
        },
        {
          id: 2, title: 'parody',
          sub: [
            { id: 2, title: 'genshin impact', },
          ],
        },
        {
          id: 3, title: 'female',
          sub: [
            { id: 3, title: 'horn', },
            { id: 4, title: 'bikini', },
            { id: 5, title: 'gloves', },
            { id: 6, title: 'long hair', },
            { id: 7, title: 'blue hair', },
            { id: 8, title: 'swim suit', },
          ],
        },
        {
          id: 4, title: 'misc',
          sub: [
            { id: 9, title: 'artist cg', },
            { id: 10, title: 'slime', },
            { id: 10, title: 'slime', },
          ],
        },
      ],
    },
    //--- image ---
    {
      id: 4,
      title: 'img s:720X960 title',
      description: 'cover',
      type: 'image',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/720X960.jpg', },
        normal: { path: '/smp/720X960.jpg', },
        raw: { path: '/smp/720X960.jpg', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 5,
      title: 'img s:960X720 title',
      description: 'no cover',
      type: 'image',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/960X720.jpg', },
        normal: { path: '/smp/960X720.jpg', },
        raw: { path: '/smp/960X720.jpg', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 6,
      title: 'img s:1680X720 title',
      description: 'no cover, tag',
      type: 'image',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/1680X720.jpg', },
        normal: { path: '/smp/1680X720.jpg', },
        raw: { path: '/smp/1680X720.jpg', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
      tag: [
        {
          id: 1, title: 'language',
          sub: [
            { id: 1, title: 'chinese', },
          ],
        },
        {
          id: 2, title: 'parody',
          sub: [
            { id: 2, title: 'genshin impact', },
          ],
        },
        {
          id: 3, title: 'female',
          sub: [
            { id: 3, title: 'horn', },
            { id: 4, title: 'bikini', },
            { id: 5, title: 'gloves', },
            { id: 6, title: 'long hair', },
            { id: 7, title: 'blue hair', },
            { id: 8, title: 'swim suit', },
          ],
        },
        {
          id: 4, title: 'misc',
          sub: [
            { id: 9, title: 'artist cg', },
            { id: 10, title: 'slime', },
            { id: 10, title: 'slime', },
          ],
        },
      ],
    },
    //--- audio ---
    {
      id: 7,
      title: 'audio:asa.mp3 title',
      description: 'cover, file cover',
      type: 'audio',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/asa.jpg', },
        // cover:{path: '/smp/asa.jpg',},
        normal: { path: '/smp/asa.mp3', },
        raw: { path: '/smp/asa.mp3', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 8,
      title: 'audio:butterfly.mp3 title',
      description: 'no cover, file cover',
      type: 'audio',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/butterfly.jpg', },
        // cover:{path: '/smp/butterfly.jpg',},
        normal: { path: '/smp/butterfly.mp3', },
        raw: { path: '/smp/butterfly.mp3', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 9,
      title: 'audio:katyusha.mp3 title',
      description: 'no cover, no file cover',
      type: 'audio',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/960X720.jpg', },
        normal: { path: '/smp/katyusha.mp3', },
        raw: { path: '/smp/katyusha.mp3', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
      tag: [
        {
          id: 1, title: 'language',
          sub: [
            { id: 1, title: 'chinese', },
          ],
        },
        {
          id: 2, title: 'parody',
          sub: [
            { id: 2, title: 'genshin impact', },
          ],
        },
        {
          id: 3, title: 'female',
          sub: [
            { id: 3, title: 'horn', },
            { id: 4, title: 'bikini', },
            { id: 5, title: 'gloves', },
            { id: 6, title: 'long hair', },
            { id: 7, title: 'blue hair', },
            { id: 8, title: 'swim suit', },
          ],
        },
        {
          id: 4, title: 'misc',
          sub: [
            { id: 9, title: 'artist cg', },
            { id: 10, title: 'slime', },
            { id: 10, title: 'slime', },
          ],
        },
      ],
    },
    //--- video ---
    {
      id: 10,
      title: 'video:madoka.mp4 title',
      description: 'cover, file cover',
      type: 'video',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '/smp/madoka.jpg', },
        cover: { path: '/smp/madoka.jpg', },
        path_subtitle: '/smp/madoka.vtt',
        normal: { path: '/smp/madoka.mp4', },
        raw: { path: '/smp/madoka.mp4', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 11,
      title: 'video:rail.mp4 title',
      description: 'no cover, file cover',
      type: 'video',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        cover: { path: '/smp/rail.jpg', },
        // cover:{path: '/smp/rail.jpg',},
        // path_subtitle: '/smp/rail.vtt',
        normal: { path: '/smp/rail.mp4', },
        raw: { path: '/smp/rail.mp4', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 12,
      title: 'video:shinobu.mp4 title',
      description: 'no cover, no file cover',
      type: 'video',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        cover: { path: '/smp/shinobu.jpg', },
        // path_subtitle: '/smp/shinobu.vtt',
        normal: { path: '/smp/shinobu.mp4', },
        raw: { path: '/smp/shinobu.mp4', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
      tag: [
        {
          id: 1, title: 'language',
          sub: [
            { id: 1, title: 'chinese', },
          ],
        },
        {
          id: 2, title: 'parody',
          sub: [
            { id: 2, title: 'genshin impact', },
          ],
        },
        {
          id: 3, title: 'female',
          sub: [
            { id: 3, title: 'horn', },
            { id: 4, title: 'bikini', },
            { id: 5, title: 'gloves', },
            { id: 6, title: 'long hair', },
            { id: 7, title: 'blue hair', },
            { id: 8, title: 'swim suit', },
          ],
        },
        {
          id: 4, title: 'misc',
          sub: [
            { id: 9, title: 'artist cg', },
            { id: 10, title: 'slime', },
            { id: 10, title: 'slime', },
          ],
        },
      ],
    },
    //--- binary ---
    {
      id: 13,
      title: 'binary:zzz title',
      description: 'description',
      type: 'binary',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 14,
      title: 'binary:zzz title',
      description: 'description',
      type: 'binary',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 15,
      title: 'binary:zzz title',
      description: 'description',
      type: 'binary',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    //--- archive ---
    {
      id: 16,
      title: 'archive:zzz title',
      description: 'description',
      type: 'archive',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 17,
      title: 'archive:zzz title',
      description: 'description',
      type: 'archive',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 18,
      title: 'archive:zzz title',
      description: 'description',
      type: 'archive',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    //--- text ---
    {
      id: 19,
      title: 'text:19zzz title',
      description: 'description',
      type: 'text',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 20,
      title: 'text:20zzz title',
      description: 'description',
      type: 'text',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
    {
      id: 21,
      title: 'text:21zzz title',
      description: 'description',
      type: 'text',
      is_file: 1,
      is_fav: 1,
      time_create: '1919-08-10 11:45:14',
      time_update: '1919-08-10 11:45:14',
      file: {
        // cover: { path: '', },
        normal: { path: '', },
        raw: { path: '', },
      },
      tree: [{ id: 0, title: 'root' }, { id: 1, title: 'path1' },],
    },
  ]
} as api_file_list_resp;