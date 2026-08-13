import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envText.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const key = env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'] || '';

const supabase = createClient(url, key);

// People Mapping from DB
// Yuhas:
//   Piyum Sankalpa: '4bdf0bd7-dbba-43ab-a11b-c824386b349c'
//   Aloka Kumarasinghe: '13703c50-2cdc-4142-a065-b764e0665441'
// Yakkala:
//   Thusitha Muththunga: 'ea56f954-251a-452e-b396-56af8fbb91c8'
//   Malkanthi Pathiraja: 'a3c32032-6db4-4a0f-beb4-c44091c6ba6b'
//   Gimhani Sankalpana: '9b5b9590-3ab2-465c-a4b0-bd64bed719af'
//   Elan: 'd8194df1-f0e4-4738-b7fd-f9919723ac97'
// Radawana:
//   Mala Kanangama: '757b96bf-f3d3-46c1-bc67-cfbed8fe5d41'
//   Mahinda Kumara: '2549ec7f-8fc9-4ee5-9802-0f78fcb7eb92'
//   Daham Kumarasinghe: '5109af33-589b-4385-956e-d520d93ee9ca'
// Ganga:
//   Savithri Wickramanayake: '0fe8053e-4735-4fa0-9f54-5ba775a231e1'

const P = {
  Piyum: '4bdf0bd7-dbba-43ab-a11b-c824386b349c',
  Aloka: '13703c50-2cdc-4142-a065-b764e0665441',
  Thusitha: 'ea56f954-251a-452e-b396-56af8fbb91c8',
  Malkanthi: 'a3c32032-6db4-4a0f-beb4-c44091c6ba6b',
  Gimhani: '9b5b9590-3ab2-465c-a4b0-bd64bed719af',
  Elan: 'd8194df1-f0e4-4738-b7fd-f9919723ac97',
  Mala: '757b96bf-f3d3-46c1-bc67-cfbed8fe5d41',
  Mahinda: '2549ec7f-8fc9-4ee5-9802-0f78fcb7eb92',
  Daham: '5109af33-589b-4385-956e-d520d93ee9ca',
  Savithri: '0fe8053e-4735-4fa0-9f54-5ba775a231e1'
};

const ALL_MEMBERS = Object.values(P);

const sampleExpenses = [
  {
    title: 'Highway Toll & Morning Tea',
    amount: 3500,
    paid_by: P.Piyum,
    created_by: P.Piyum,
    occurred_at: '2026-08-12T06:30:00.000Z',
    note: 'Highway toll tickets & morning herbal tea and rotti at Welipenna rest area.',
    members: ALL_MEMBERS
  },
  {
    title: 'Van Fuel Full Tank',
    amount: 14000,
    paid_by: P.Thusitha,
    created_by: P.Thusitha,
    occurred_at: '2026-08-12T08:15:00.000Z',
    note: 'Diesel refill for trip van at Anuradhapura fuel station.',
    members: ALL_MEMBERS
  },
  {
    title: 'Ruwanwelisaya Temple Offerings',
    amount: 2500,
    paid_by: P.Savithri,
    created_by: P.Savithri,
    occurred_at: '2026-08-12T10:00:00.000Z',
    note: 'Lotus flower bundles, oil lamps, and worship offerings.',
    members: ALL_MEMBERS
  },
  {
    title: 'Day 1 Rice & Curry Lunch Buffet',
    amount: 18500,
    paid_by: P.Mahinda,
    created_by: P.Daham,
    occurred_at: '2026-08-12T13:00:00.000Z',
    note: 'Traditional Sri Lankan lunch buffet near Tissa Wewa for all 10 members.',
    members: ALL_MEMBERS
  },
  {
    title: 'Fresh King Coconuts & Ice Cream',
    amount: 3200,
    paid_by: P.Aloka,
    created_by: P.Aloka,
    occurred_at: '2026-08-12T15:30:00.000Z',
    note: 'Chilled thambili and herbal ice creams during sacred city walk.',
    members: [P.Piyum, P.Aloka, P.Gimhani, P.Daham, P.Elan]
  },
  {
    title: 'Lake Wave Resort Accommodation Advance',
    amount: 35000,
    paid_by: P.Thusitha,
    created_by: P.Thusitha,
    occurred_at: '2026-08-12T18:00:00.000Z',
    note: '4 Deluxe family rooms stay with bed & breakfast in Polonnaruwa.',
    members: ALL_MEMBERS
  },
  {
    title: 'Polonnaruwa Guided Heritage Tour',
    amount: 6000,
    paid_by: P.Mala,
    created_by: P.Mala,
    occurred_at: '2026-08-13T09:00:00.000Z',
    note: 'Archaeology site entrance permits and official guide fees for Quadrangle.',
    members: ALL_MEMBERS
  },
  {
    title: 'Resort Evening BBQ & Dinner Feast',
    amount: 22400,
    paid_by: P.Piyum,
    created_by: P.Piyum,
    occurred_at: '2026-08-12T20:30:00.000Z',
    note: 'Grilled chicken BBQ, fried rice, devilled dishes, and beverages.',
    members: ALL_MEMBERS
  },
  {
    title: 'Minneriya Safari 4x4 Jeeps',
    amount: 16000,
    paid_by: P.Daham,
    created_by: P.Daham,
    occurred_at: '2026-08-13T14:30:00.000Z',
    note: '2 Safari jeeps rental for wild elephant gathering tour.',
    members: [P.Thusitha, P.Malkanthi, P.Gimhani, P.Elan, P.Mala, P.Mahinda, P.Daham]
  },
  {
    title: 'Fresh Fruits & Souvenirs Basket',
    amount: 4800,
    paid_by: P.Malkanthi,
    created_by: P.Malkanthi,
    occurred_at: '2026-08-13T17:00:00.000Z',
    note: 'Woodapple, mangoes, roasted cashews, and local sweetmeats for journey back.',
    members: ALL_MEMBERS
  }
];

async function seed() {
  console.log('Seeding 10 test expenses...');

  for (const exp of sampleExpenses) {
    const { title, amount, paid_by, created_by, occurred_at, note, members } = exp;

    // Insert expense
    const { data: expData, error: expErr } = await supabase.from('expenses').insert({
      title,
      amount,
      paid_by,
      created_by,
      occurred_at,
      note
    }).select().single();

    if (expErr || !expData) {
      console.error(`Failed to insert expense "${title}":`, expErr);
      continue;
    }

    // Insert splits
    const memberCount = members.length;
    const shareAmount = Math.round((amount / memberCount) * 100) / 100;

    const splitsToInsert = members.map(personId => ({
      expense_id: expData.id,
      person_id: personId,
      share_amount: shareAmount
    }));

    const currentTotal = shareAmount * memberCount;
    const remainder = Math.round((amount - currentTotal) * 100) / 100;

    if (Math.abs(remainder) > 0.001) {
      const payerIndex = splitsToInsert.findIndex(s => s.person_id === paid_by);
      if (payerIndex !== -1) {
        splitsToInsert[payerIndex].share_amount = Math.round((splitsToInsert[payerIndex].share_amount + remainder) * 100) / 100;
      } else {
        splitsToInsert[0].share_amount = Math.round((splitsToInsert[0].share_amount + remainder) * 100) / 100;
      }
    }

    const { error: splitErr } = await supabase.from('expense_splits').insert(splitsToInsert);
    if (splitErr) {
      console.error(`Failed splits for expense "${title}":`, splitErr);
    } else {
      console.log(`✅ Added: "${title}" (Rs. ${amount}) paid by ${paid_by} split among ${memberCount} members`);
    }
  }

  console.log('Done seeding!');
}

seed();
