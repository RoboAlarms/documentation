import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
export default defineConfig({
  site: 'https://docs.roboalarms.com',
  integrations: [starlight({
    title: 'RoboAlarms',
    description: 'Clear, practical guides to using and setting up RoboAlarms.',
    logo: { src: './src/assets/brand/roboalarms-mark.png', replacesTitle: false },
    favicon: '/favicon.png',
    customCss: ['./src/styles/custom.css'],
    components: { Footer: './src/components/DocsFooter.astro' },
    sidebar: [
      { label: 'Start here', items: [
        {label: 'RoboAlarms website', link: 'https://roboalarms.com'},
        {label: 'Documentation home', slug: ''},
        {label: 'Find a task', slug: 'reference/task-index'},
        {label: 'About this edition', slug: 'reference/edition'},
      ]},
      { label: 'User Guide', items: [{ autogenerate: { directory: 'user' }}]},
      { label: 'Installer Guide', items: [{ autogenerate: { directory: 'installer' }}]},
      { label: 'Integrations', items: [{ autogenerate: { directory: 'integrations' }}]},
      { label: 'Flasher Guide', items: [{ autogenerate: { directory: 'flasher' }}]},
      { label: 'Panel Manager Guide', items: [{ autogenerate: { directory: 'panel-manager' }}]},
      { label: 'Reference & help', items: [
        {label: 'Troubleshooting', slug: 'reference/troubleshooting'},
        {label: 'Access & permissions', slug: 'reference/permissions'},
        {label: 'Glossary', slug: 'reference/glossary'},
      ]},
    ],
    pagination: true,
    lastUpdated: false,
  })],
});
