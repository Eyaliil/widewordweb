// Script to load sample data into the database
// Run with: node load-sample-data.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function loadSampleData() {
  try {
    console.log('📥 Loading sample data into database...');
    
    // Read the sample data SQL file
    const sqlPath = path.join(__dirname, 'sample-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          
          // Use the Supabase client to execute the statement
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (stmtError) {
          console.error(`❌ Error executing statement ${i + 1}:`, stmtError.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
    
    if (errorCount === 0) {
      console.log('🎉 Sample data loaded successfully!');
      
      // Verify the data was loaded
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .limit(5);
      
      console.log(`✅ ${profiles.length} profiles loaded`);
    } else {
      console.log('⚠️ Some errors occurred. Check the output above for details.');
    }
    
  } catch (error) {
    console.error('❌ Failed to load sample data:', error.message);
    console.log('\n💡 Alternative: You can manually run the SQL file in your Supabase dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Click on "SQL Editor"');
    console.log('   3. Copy and paste the contents of sample-data.sql');
    console.log('   4. Click "Run"');
  }
}

loadSampleData();
