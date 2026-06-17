const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// GET user's appliances
router.get('/appliances', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const { data: rows, error } = await supabase
      .from('appliances')
      .select('id, name, power_consumption, hours')
      .eq('user_id', userId);

    if (error) {
      console.error('Database error fetching appliances:', error);
      return res.status(500).json({ message: 'Error retrieving appliances' });
    }

    const appliances = (rows || []).map(row => ({
      id: row.id,
      name: row.name,
      powerConsumption: row.power_consumption,
      hours: row.hours
    }));
    
    return res.json({ appliances });
  } catch (error) {
    console.error('Get appliances error:', error);
    res.status(500).json({ message: 'Error retrieving appliances' });
  }
});

// GET user's energy summary
router.get('/summary', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const { data: row, error } = await supabase
      .from('user_energy_summary')
      .select('daily_consumption, monthly_consumption')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Database error fetching summary:', error);
      return res.status(500).json({ message: 'Error retrieving energy summary' });
    }
    
    // If no summary exists yet, return zeros
    if (!row) {
      return res.json({ 
        summary: { 
          dailyConsumption: 0, 
          monthlyConsumption: 0 
        } 
      });
    }
    
    return res.json({ 
      summary: {
        dailyConsumption: row.daily_consumption,
        monthlyConsumption: row.monthly_consumption
      } 
    });
  } catch (error) {
    console.error('Get energy summary error:', error);
    res.status(500).json({ message: 'Error retrieving energy summary' });
  }
});

// POST/Update user's appliances
router.post('/appliances', auth, async (req, res) => {
  const userId = req.user.id;
  const { appliances } = req.body;
  
  if (!appliances || !Array.isArray(appliances)) {
    return res.status(400).json({ message: 'Invalid appliance data' });
  }
  
  // Calculate total energy consumption
  let dailyConsumption = 0;
  appliances.forEach(appliance => {
    // kWh = Power (watts) * Hours / 1000
    const applianceConsumption = (appliance.powerConsumption * appliance.hours) / 1000;
    dailyConsumption += applianceConsumption;
  });
  
  const monthlyConsumption = dailyConsumption * 30;
  
  try {
    // 1. Delete existing appliances for this user
    const { error: deleteError } = await supabase
      .from('appliances')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete appliances error:', deleteError);
      return res.status(500).json({ success: false, message: 'Error saving appliance data' });
    }
    
    // 2. Insert new appliances
    if (appliances.length > 0) {
      const insertData = appliances.map(app => ({
        user_id: userId,
        name: app.name,
        power_consumption: app.powerConsumption || 0,
        hours: app.hours || 0
      }));

      const { error: insertError } = await supabase
        .from('appliances')
        .insert(insertData);

      if (insertError) {
        console.error('Insert appliances error:', insertError);
        return res.status(500).json({ success: false, message: 'Error saving appliance data' });
      }
    }
    
    // 3. Update or insert the energy summary (upsert)
    const { error: summaryError } = await supabase
      .from('user_energy_summary')
      .upsert({
        user_id: userId,
        daily_consumption: dailyConsumption,
        monthly_consumption: monthlyConsumption,
        last_updated: new Date().toISOString()
      });

    if (summaryError) {
      console.error('Upsert energy summary error:', summaryError);
      return res.status(500).json({ success: false, message: 'Error saving appliance data' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Appliance data saved successfully',
      summary: {
        dailyConsumption,
        monthlyConsumption
      }
    });
  } catch (error) {
    console.error('Error saving appliances:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error saving appliance data' 
    });
  }
});

// GET leaderboard data (all users ranked by energy savings)
router.get('/leaderboard', auth, async (req, res) => {
  try {
    // Get all user summaries, joining username
    const { data: summaries, error } = await supabase
      .from('user_energy_summary')
      .select(`
        daily_consumption,
        monthly_consumption,
        users (
          username
        )
      `);

    if (error) {
      console.error('Database error fetching leaderboard:', error);
      return res.status(500).json({ message: 'Error retrieving leaderboard data' });
    }

    // Get average monthly consumption across all users
    const totalConsumption = (summaries || []).reduce((sum, s) => sum + s.monthly_consumption, 0);
    const avgConsumption = summaries && summaries.length > 0 ? totalConsumption / summaries.length : 0;

    // Calculate savings percentage and map rows
    const rows = (summaries || []).map(s => {
      const monthlyConsumption = s.monthly_consumption;
      const savingsPercentage = monthlyConsumption === 0 || avgConsumption === 0 ? 0 :
        ((avgConsumption - monthlyConsumption) / avgConsumption) * 100;
      const energySaved = monthlyConsumption === 0 || avgConsumption === 0 ? 0 :
        (avgConsumption - monthlyConsumption);

      return {
        username: s.users?.username || 'Unknown',
        dailyConsumption: s.daily_consumption,
        monthlyConsumption: s.monthly_consumption,
        savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
        energySaved: parseFloat(energySaved.toFixed(2))
      };
    });

    // Sort by savings percentage DESC, energy saved DESC
    rows.sort((a, b) => {
      if (b.savingsPercentage !== a.savingsPercentage) {
        return b.savingsPercentage - a.savingsPercentage;
      }
      return b.energySaved - a.energySaved;
    });

    // Add rank badges based on position
    const rankedData = rows.map((row, index) => {
      let badge = 'New';
      
      if (index === 0) badge = 'Energy Champion';
      else if (index === 1) badge = 'Energy Master';
      else if (index === 2) badge = 'Energy Expert';
      else if (index < 10) badge = 'Energy Saver';
      
      return {
        ...row,
        badge
      };
    });
    
    return res.json({ 
      leaderboard: rankedData,
      averageConsumption: avgConsumption
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ message: 'Error retrieving leaderboard data' });
  }
});

module.exports = router;