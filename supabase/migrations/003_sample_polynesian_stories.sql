-- Sample Traditional Polynesian Stories with Cultural Annotations and Branching Narratives
-- This migration adds authentic Polynesian stories for the Interactive Story System

-- Insert sample stories
INSERT INTO stories (
  title, 
  description, 
  category, 
  difficulty_level, 
  estimated_duration, 
  cultural_region,
  cultural_authenticity_score, 
  is_published,
  author_id
) VALUES 
(
  'Maui and the Sun',
  'The legendary tale of how the demigod Maui slowed down the sun to give his people more daylight. This story teaches about courage, determination, and the importance of helping your community.',
  'mythology',
  'beginner',
  15,
  'polynesia',
  95,
  true,
  '00000000-0000-0000-0000-000000000000' -- System user
),
(
  'The Voyage of Kupe',
  'Follow the great navigator Kupe as he discovers Aotearoa (New Zealand). Learn about Polynesian navigation techniques and the spirit of exploration that led to the settlement of the Pacific islands.',
  'history',
  'intermediate',
  25,
  'polynesia',
  92,
  true,
  '00000000-0000-0000-0000-000000000000'
),
(
  'Pele and the Sacred Fire',
  'The story of Pele, the volcano goddess, and her journey across the Pacific. Discover the spiritual beliefs surrounding volcanoes and the respect Polynesians have for natural forces.',
  'mythology',
  'advanced',
  30,
  'polynesia',
  98,
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- Get the story IDs for reference
DO $$
DECLARE
  maui_story_id UUID;
  kupe_story_id UUID;
  pele_story_id UUID;
BEGIN
  -- Get story IDs
  SELECT id INTO maui_story_id FROM stories WHERE title = 'Maui and the Sun';
  SELECT id INTO kupe_story_id FROM stories WHERE title = 'The Voyage of Kupe';
  SELECT id INTO pele_story_id FROM stories WHERE title = 'Pele and the Sacred Fire';

  -- Insert story passages for "Maui and the Sun"
  INSERT INTO story_passages (story_id, title, content, passage_number, is_starting_passage, is_ending_passage) VALUES
  (maui_story_id, 'The Problem', 'Long ago, in the time when the world was young, the sun raced across the sky so quickly that there was barely enough time for people to complete their daily tasks. The fishermen could not catch enough fish, the farmers could not tend their crops, and the women could not dry their tapa cloth. The people suffered because the days were too short.

Young Maui watched his mother struggle to dry the bark cloth she had worked so hard to make. Each day, just as the cloth began to dry, the sun would disappear beyond the horizon, leaving everything damp and useless.

"Someone must do something about this," Maui declared to his brothers.', 1, true, false),
  
  (maui_story_id, 'The Decision', 'Maui''s brothers laughed at him. "You are just a boy, Maui. How could you possibly catch the sun? It is too powerful, too fast, too far away."

But Maui was determined. He had always been different from his brothers - smaller in size but greater in courage and cleverness. He remembered the stories his grandmother had told him about the old magic, about ropes that could hold anything, and about the power that comes from a pure heart.

"I will find a way," Maui said firmly. "Our people need longer days, and I will give them to them."

What should Maui do first?', 2, false, false),
  
  (maui_story_id, 'Seeking Wisdom', 'Maui decided to seek the wisdom of his grandmother, who was known throughout the islands for her knowledge of the old ways. She lived in a cave at the edge of the world, where the sea meets the sky.

When Maui told her of his plan, his grandmother nodded slowly. "The sun is indeed too fast, grandson. But there is a way to slow it down. You must weave a rope from the sacred coconut fiber, and you must approach the sun at its home in the east, where it sleeps before beginning its daily journey."

She taught him the ancient chants that would give the rope its power and showed him how to weave it with intention and respect. "Remember, Maui," she said, "you do this not for glory, but for your people. The sun will respect this."', 3, false, false),
  
  (maui_story_id, 'The Confrontation', 'Armed with his magical rope and his grandmother''s wisdom, Maui traveled to the eastern edge of the world. There, he found the sun sleeping in its house, preparing for another day of racing across the sky.

Maui worked quickly and quietly, using his rope to create a great snare around the sun''s house. When the sun began to rise, it found itself caught in Maui''s trap.

"Who dares to bind me?" roared the sun, its voice like thunder.

"I am Maui," the young hero replied bravely. "I have caught you because you move too quickly across the sky. My people suffer because the days are too short."', 4, false, false),
  
  (maui_story_id, 'The Agreement', 'The sun struggled against the ropes, but they held firm, woven as they were with ancient magic and pure intention. Gradually, the sun realized that Maui spoke the truth - in its eagerness to complete its daily journey, it had forgotten about the people below who depended on its light.

"You are brave, young Maui," the sun said finally. "And you speak with wisdom. I agree to slow my journey across the sky, so that your people may have longer days to complete their work."

From that day forward, the sun moved more slowly across the heavens, giving the people enough time to fish, farm, and complete their daily tasks. Maui had succeeded where others thought it impossible, and his people prospered.

The story of Maui and the sun reminds us that with courage, wisdom, and pure intentions, even the smallest among us can accomplish great things for the benefit of all.', 5, false, true);

  -- Insert story passages for "The Voyage of Kupe"
  INSERT INTO story_passages (story_id, title, content, passage_number, is_starting_passage, is_ending_passage) VALUES
  (kupe_story_id, 'The Great Navigator', 'In the ancient times, when the Pacific Ocean was still largely unexplored, there lived a great navigator named Kupe. He was known throughout Hawaiki for his skill in reading the stars, the waves, and the flight patterns of birds. His waka (canoe) was carved from the finest totara wood, and his crew was made up of the bravest and most skilled sailors.

Kupe possessed the traditional knowledge passed down through generations - how to navigate by the stars, how to read the color of the water, and how to follow the paths of migrating whales and birds. This knowledge, called wayfinding, was sacred and powerful.

One day, a great octopus began terrorizing the fishing grounds near Hawaiki, destroying nets and frightening away the fish. The people turned to Kupe for help.', 1, true, false),
  
  (kupe_story_id, 'The Pursuit', 'Kupe accepted the challenge to hunt the giant octopus. He prepared his waka with care, gathering provisions for what might be a long journey. His wife Hine-te-aparangi and their children joined him, as was the custom for such important voyages.

Following the trail of the octopus, Kupe sailed further into the Pacific than any Polynesian had gone before. He used all his navigational skills - watching the stars, reading the wave patterns, and following the flight of the frigate birds that indicated land ahead.

For many days they sailed, always following the signs left by the great octopus. The journey tested all of Kupe''s knowledge and the courage of his crew.

What navigation technique should Kupe rely on most?', 2, false, false),
  
  (kupe_story_id, 'Star Navigation', 'Kupe chose to rely primarily on the stars, the most reliable guides for long ocean voyages. Each night, he would study the star compass his ancestors had taught him - the rising and setting points of key stars that marked directions across the vast Pacific.

He taught his crew the star names and their meanings: "See there, the star we call the Fisherman''s Star - it points the way south. And there, the Navigator''s Star, which will guide us home when our journey is complete."

Using this ancient knowledge, Kupe was able to maintain his course even when clouds covered the sky during the day. The stars never lied, and they led him ever onward in pursuit of the octopus.', 3, false, false),
  
  (kupe_story_id, 'The Discovery', 'After many weeks of sailing, Kupe noticed new signs - different birds, a different color to the water, and clouds that seemed to hang in one place on the horizon. These were the signs of land, and not just any land, but a large landmass.

As they sailed closer, Kupe and his crew saw something magnificent - a long, mountainous land covered in green forests, with white clouds hanging over its peaks. It was unlike any island they had ever seen.

"Aotearoa!" Kupe exclaimed, meaning "Land of the Long White Cloud." The octopus had led them to a new world.

They landed and explored this new land, finding it rich with resources - forests full of birds, rivers full of fish, and fertile soil. Kupe knew this discovery would change the lives of his people forever.', 4, false, false),
  
  (kupe_story_id, 'The Return', 'After exploring Aotearoa and finally defeating the octopus in the waters around the new land, Kupe faced an important decision. Should he stay in this beautiful new place, or return to Hawaiki to tell his people of the discovery?

Kupe chose to return, using his navigational skills to find his way back across the vast Pacific. When he arrived in Hawaiki, he shared detailed sailing directions with his people - the star bearings, the wave patterns, the bird signs, and the number of days'' sailing required.

"Sail towards the setting sun," he told them, "follow the path of the long white cloud, and you will find a land of plenty."

Many generations later, following Kupe''s directions, the great migration waka would arrive in Aotearoa, beginning the settlement of New Zealand. Kupe''s courage and skill as a navigator had opened the way to a new homeland for his people.', 5, false, true);

  -- Insert story passages for "Pele and the Sacred Fire"
  INSERT INTO story_passages (story_id, title, content, passage_number, is_starting_passage, is_ending_passage) VALUES
  (pele_story_id, 'The Fire Goddess', 'In the beginning, Pele was born from the sacred fires of the earth itself. She was the daughter of Haumea, the earth mother, and Kane-hoa-lani, the sky father. From birth, Pele possessed the power to create and destroy with volcanic fire, and her temperament was as fierce and unpredictable as the molten lava that flowed from her being.

Pele lived with her family in Kahiki, the ancestral homeland, but her fiery nature often brought conflict. Her older sister Namaka, goddess of the sea, feared Pele''s power and the destruction it could bring. The two sisters represented the eternal struggle between fire and water, creation and cooling, passion and calm.

When tensions between the sisters reached a breaking point, Pele knew she must leave Kahiki to find a new home where she could express her true nature without bringing harm to her family.', 1, true, false),
  
  (pele_story_id, 'The Journey Begins', 'Pele gathered her sacred items - her digging stick Pa-oa, which could create volcanic craters, and her younger sister Hi''iaka, who was still in egg form. She also brought her loyal brothers, who would help her in her journey across the Pacific.

Setting out in a great canoe, Pele began her search for a new home. She needed a place where she could dig deep into the earth and create her volcanic fires without interference from Namaka''s ocean waters.

As they sailed across the vast Pacific, Pele tested many islands, using her digging stick to create volcanic craters. But each time, her sister Namaka would follow, sending great waves to extinguish Pele''s fires and flood her volcanic homes.

How should Pele choose her next island to test?', 2, false, false),
  
  (pele_story_id, 'Reading the Signs', 'Pele decided to read the spiritual signs of the islands before choosing where to make her home. She looked for places where the mana (spiritual power) of the earth was strongest, where the connection between the physical and spiritual worlds was most clear.

Flying ahead in her spirit form, Pele could sense the spiritual energy of each island. Some were too small, others too close to the ocean''s reach. She needed a place where she could dig deep enough that Namaka''s waters could not reach her sacred fires.

As she approached the chain of islands that would become known as Hawaii, Pele felt a powerful spiritual calling. These islands had the right combination of size, spiritual energy, and distance from Namaka''s strongest influence.', 3, false, false),
  
  (pele_story_id, 'The Sacred Home', 'On the big island of Hawaii, Pele found what she was looking for - Kilauea, a place where she could dig deep into the earth and create a volcanic home that would be protected from her sister''s ocean waters. The spiritual energy of this place was perfect for her needs.

Using her sacred digging stick, Pele created the great crater of Kilauea, going deep enough that Namaka''s waters could not reach her. Here, she could tend her sacred fires and create new land through volcanic activity, fulfilling her role as both creator and destroyer.

The native people of the islands came to understand and respect Pele''s power. They learned to read the signs of her moods - when she was content, the lava flowed gently, creating new land. When she was angry, the eruptions were fierce and destructive.

What should the people''s relationship with Pele be?', 4, false, false),
  
  (pele_story_id, 'Respect and Balance', 'The wise people of Hawaii learned that the proper relationship with Pele was one of respect and understanding. They developed rituals and protocols for honoring the volcano goddess - offering ho''okupu (gifts) of food and flowers, chanting prayers before traveling near her domain, and always showing proper respect for her sacred places.

They understood that Pele''s volcanic activity was not random destruction, but part of the natural cycle of creation. The lava that destroyed also created new land, and the volcanic soil was incredibly fertile for growing crops.

The people learned to live in harmony with Pele''s power, building their homes in safe areas and always being prepared to move when she needed to express her creative force. They passed down stories and chants that taught respect for the natural world and the spiritual forces that shape the islands.

This wisdom - that humans must live in respectful balance with the powerful forces of nature - became a central part of Hawaiian culture and spirituality, teaching that we are not separate from the natural world, but part of it.', 5, false, true);

  -- Insert story choices for "Maui and the Sun"
  INSERT INTO story_choices (from_passage_id, to_passage_id, choice_text, cultural_significance, choice_order) VALUES
  ((SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 3),
   'Seek wisdom from his grandmother who knows the old ways',
   'Shows the importance of respecting elders and traditional knowledge in Polynesian culture', 1),
  ((SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 4),
   'Go directly to confront the sun with his own strength',
   'Demonstrates individual courage but misses the cultural value of seeking guidance', 2);

  -- Insert story choices for "The Voyage of Kupe"
  INSERT INTO story_choices (from_passage_id, to_passage_id, choice_text, cultural_significance, choice_order) VALUES
  ((SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 3),
   'Follow the stars using traditional navigation',
   'Emphasizes the sophisticated wayfinding knowledge of Polynesian navigators', 1),
  ((SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 4),
   'Follow the flight patterns of birds',
   'Shows understanding of natural signs and ecological knowledge', 2);

  -- Insert story choices for "Pele and the Sacred Fire"
  INSERT INTO story_choices (from_passage_id, to_passage_id, choice_text, cultural_significance, choice_order) VALUES
  ((SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 3),
   'Read the spiritual signs and mana of each island',
   'Demonstrates the importance of spiritual awareness and connection to the land', 1),
  ((SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 2),
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 4),
   'Choose the largest island for maximum space',
   'Practical but misses the spiritual dimension of place selection', 2),
  ((SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 4),
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 5),
   'Live in respectful balance with Pele''s power',
   'Embodies the core Polynesian value of living in harmony with natural forces', 1),
  ((SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 4),
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 5),
   'Try to control or appease Pele through offerings alone',
   'Shows respect but misses the deeper lesson about living in balance with nature', 2);

  -- Insert cultural annotations for "Maui and the Sun"
  INSERT INTO cultural_annotations (story_id, passage_id, title, content, annotation_type, external_links) VALUES
  (maui_story_id,
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 1),
   'Tapa Cloth Making',
   'Tapa cloth (also called kapa in Hawaii) is traditional bark cloth made from the inner bark of trees like mulberry, breadfruit, or banyan. The process involves harvesting the bark, soaking it, and beating it with wooden mallets to create a soft, flexible fabric. This was one of the most important textile arts in Polynesian culture, used for clothing, bedding, and ceremonial purposes. The drying process mentioned in the story was crucial - the cloth needed consistent sunlight to properly cure and become durable.',
   'tradition',
   '["https://en.wikipedia.org/wiki/Tapa_cloth"]'::jsonb),
  (maui_story_id,
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 2),
   'Maui the Trickster Hero',
   'Maui is one of the most important figures in Polynesian mythology, appearing in the oral traditions of Hawaii, New Zealand, Tahiti, and other Pacific islands. He is typically portrayed as a clever trickster hero who uses wit and magic rather than brute strength to accomplish seemingly impossible tasks. Maui stories often teach important cultural values about courage, cleverness, and helping one''s community. Different islands have variations of Maui stories, but common themes include his small stature, his magical abilities, and his willingness to challenge gods and natural forces for the benefit of humanity.',
   'cultural_context',
   '["https://en.wikipedia.org/wiki/Māui_(mythology)"]'::jsonb),
  (maui_story_id,
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 3),
   'Respect for Elders and Traditional Knowledge',
   'In Polynesian cultures, elders (kupuna in Hawaiian) are highly respected as keepers of traditional knowledge, wisdom, and cultural practices. Seeking guidance from elders before undertaking important tasks is a fundamental cultural value. Grandmothers, in particular, often hold special roles as teachers of cultural traditions, healers, and spiritual guides. The concept of traditional knowledge being passed down through generations is central to Polynesian culture, covering everything from navigation and fishing to spiritual practices and storytelling.',
   'cultural_context',
   '[]'::jsonb),
  (maui_story_id,
   (SELECT id FROM story_passages WHERE story_id = maui_story_id AND passage_number = 4),
   'Sacred Coconut Fiber and Rope Making',
   'Coconut fiber (called coir) was one of the most important materials in traditional Polynesian life. The fiber from coconut husks was used to make ropes, nets, and cordage that were essential for sailing, fishing, and daily life. The process of making rope from coconut fiber was often accompanied by chants and rituals, especially when the rope was intended for important purposes. In this story, the magical properties of the rope come from both the sacred material and the spiritual intention with which it was made, reflecting the Polynesian belief that objects can be imbued with mana (spiritual power) through proper ritual and intention.',
   'tradition',
   '[]'::jsonb);

  -- Insert cultural annotations for "The Voyage of Kupe"
  INSERT INTO cultural_annotations (story_id, passage_id, title, content, annotation_type, external_links) VALUES
  (kupe_story_id,
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 1),
   'Polynesian Wayfinding and Navigation',
   'Polynesian wayfinding is one of the most sophisticated navigation systems ever developed. Master navigators could sail thousands of miles across open ocean using only natural signs - the stars, wave patterns, wind directions, cloud formations, and the behavior of birds and marine life. This knowledge was passed down through generations of navigators and was considered sacred. The ability to navigate by these natural signs allowed Polynesians to settle islands across the vast Pacific Ocean, from Easter Island to New Zealand to Hawaii.',
   'tradition',
   '["https://en.wikipedia.org/wiki/Polynesian_navigation"]'::jsonb),
  (kupe_story_id,
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 1),
   'Waka - Traditional Polynesian Canoes',
   'Waka (or va''a in other Polynesian languages) are traditional Polynesian canoes that were essential for inter-island travel and ocean voyaging. These vessels ranged from small single-hulled canoes for local fishing to large double-hulled voyaging canoes capable of carrying entire families across thousands of miles of ocean. The construction of a waka was a sacred process, often involving special rituals and the selection of specific trees. The largest voyaging waka could be over 100 feet long and carry 20-30 people along with supplies for long ocean journeys.',
   'cultural_context',
   '["https://en.wikipedia.org/wiki/Waka_(canoe)"]'::jsonb),
  (kupe_story_id,
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 3),
   'Star Compass Navigation',
   'The Polynesian star compass is a mental map of the sky used for navigation. Master navigators memorized the rising and setting points of key stars and constellations around the horizon, creating a 360-degree compass. Different stars were used for different purposes - some for maintaining direction during long voyages, others for finding specific islands. The star compass was combined with knowledge of seasonal star movements, allowing navigators to determine both direction and time of year. This system was so accurate that Polynesian navigators could find small islands after sailing for weeks across open ocean.',
   'cultural_context',
   '[]'::jsonb),
  (kupe_story_id,
   (SELECT id FROM story_passages WHERE story_id = kupe_story_id AND passage_number = 4),
   'Aotearoa - Land of the Long White Cloud',
   'Aotearoa is the Māori name for New Zealand, meaning "Land of the Long White Cloud." According to Māori tradition, this name was given by Kupe when he first sighted the land and saw the long white clouds that often hang over the mountains of New Zealand. The name reflects the Polynesian practice of naming places based on their most distinctive features as seen from the ocean. These names often served as navigation aids, helping future voyagers identify and remember important landmarks.',
   'location',
   '["https://en.wikipedia.org/wiki/Aotearoa"]'::jsonb);

  -- Insert cultural annotations for "Pele and the Sacred Fire"
  INSERT INTO cultural_annotations (story_id, passage_id, title, content, annotation_type, external_links) VALUES
  (pele_story_id,
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 1),
   'Pele - Hawaiian Volcano Goddess',
   'Pele is one of the most important deities in Hawaiian religion and culture. She is the goddess of volcanoes, lightning, fire, and wind, and is believed to live in the crater of Kilauea volcano on the Big Island of Hawaii. Pele is known for her passionate and sometimes destructive nature, reflecting the dual nature of volcanic activity - both creative (forming new land) and destructive. She is still actively worshipped today, and many Hawaiians leave offerings at volcanic sites and follow traditional protocols when visiting her domain.',
   'cultural_context',
   '["https://en.wikipedia.org/wiki/Pele_(deity)"]'::jsonb),
  (pele_story_id,
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 1),
   'Haumea and Kane-hoa-lani',
   'In Hawaiian mythology, Haumea is the goddess of fertility and childbirth, often associated with the earth and its life-giving properties. Kane-hoa-lani represents the sky father, one of the major male deities. The pairing of earth mother and sky father is common in Polynesian creation myths, representing the fundamental forces that create and sustain life. Pele''s parentage from these powerful deities explains her own immense power over the natural world.',
   'cultural_context',
   '[]'::jsonb),
  (pele_story_id,
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 3),
   'Mana - Spiritual Power',
   'Mana is a fundamental concept in Polynesian spirituality, referring to spiritual energy, power, or life force that exists in people, objects, and places. Mana can be inherited, earned through deeds, or transferred through ritual. Places with strong mana are considered sacred and are often associated with important spiritual or historical events. In this story, Pele''s ability to sense the mana of different islands reflects the Polynesian belief that the spiritual and physical worlds are interconnected, and that spiritual awareness is essential for making important decisions.',
   'cultural_context',
   '["https://en.wikipedia.org/wiki/Mana"]'::jsonb),
  (pele_story_id,
   (SELECT id FROM story_passages WHERE story_id = pele_story_id AND passage_number = 5),
   'Ho''okupu - Traditional Offerings',
    'Ho''okupu are traditional Hawaiian offerings given to show respect to deities, ancestors, or honored persons. When visiting sacred places associated with Pele, Hawaiians traditionally bring ho''okupu such as food (especially pork, fish, or poi), flowers (particularly red lehua blossoms), or other meaningful items. These offerings are not meant to "buy" favor from Pele, but to show proper respect and acknowledge her mana. The practice of giving ho''okupu reflects the Hawaiian value of reciprocity and the importance of maintaining proper relationships with the spiritual world.',
    'tradition',
    '[]'::jsonb);

END $$;