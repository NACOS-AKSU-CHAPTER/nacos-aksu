import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mnwefpnrifgzqsrpmxge.supabase.co'
const supabaseKey = 'sb_publishable_VrTd_eT2rg8lsIfNOT4-cw_XaE5z2sW'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    try {
        console.log('Testing Supabase connection...')

        // Test executives table
        const { data: execs, error: execError } = await supabase.from('executives').select('*')

        if (execError) {
            console.error('❌ Error fetching executives:', execError.message)
            return false
        }

        console.log('✅ Connection successful!')
        console.log('Executives count:', execs?.length || 0)
        console.log('Executives data:', execs)

        // Test user roles
        const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*')
        if (!rolesError) {
            console.log('User roles:', roles)
        }

        return true
    } catch (err) {
        console.error('❌ Unexpected error:', err)
        return false
    }
}

testConnection()
