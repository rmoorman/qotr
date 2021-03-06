import InvalidEncryptionError from '../../../utils/invalid-encryption-error';
import { moduleFor, test } from 'ember-qunit';

moduleFor('model:channel', 'Unit | Model | channel', {
});

test('it can be created', function(assert) {
  var channel = this.factory().create();

  assert.ok(channel.get('salt'));
  assert.ok(channel.get('password'));
  assert.ok(channel.get('key'));
  assert.equal(channel.decrypt(channel.encrypt('foo')), 'foo');
});

test('it does not allow un-encrypted text', function(assert) {
  var channel = this.factory().create();
  assert.expect(1);

  try {
    channel.decrypt('foo');
  } catch (e) {
    assert.ok(e instanceof InvalidEncryptionError);
  }
});

test('it creates an actual channel on server', function(assert) {
  var channel = this.factory().create(),
      done = assert.async();

  channel.start().then(function(resp) {
    assert.equal(channel.id, resp.id);
    done();
  });
});

test('it can load a channel', function(assert) {
  var factory = this.factory();

  var config = {
    id: 'test-channel',
    password: 'foo'
  };
  var channel = factory.create(config);
  assert.equal(channel.id, config.id);
  assert.equal(channel.password, config.password);
  assert.ok(!channel.salt);
});

test('it connects to a existing channel correctly', function(assert) {
  var factory = this.factory(),
      creator = factory.create(),
      done = assert.async();

  creator.start().then(function(resp) {
    var channel = factory.create({
      id: resp.id,
      password: creator.password
    });
    channel.connect();

    assert.ok(!channel.salt);
    assert.equal(channel.id, resp.id);

    function onSalt () {
      var str = 'foo';

      assert.equal(channel.get('salt'), creator.get('salt'));
      assert.equal(channel.get('password'), creator.get('password'));
      assert.equal(channel.get('key'), creator.get('key'));
      assert.equal(channel.get('id'), creator.get('id'));
      assert.equal(channel.get('id_b64'), creator.get('id_b64'));

      var encrypted = creator.encrypt(str);
      assert.notEqual(encrypted, str);
      assert.equal(channel.decrypt(creator.encrypt(str)), str);

      done();
    }

    channel.addObserver('salt', onSalt);
  });
});

test('it gets the list of members', function(assert) {
  assert.expect(1);

  var factory = this.factory(),
      channel = factory.create({
        nick: 'foo'
      }),
      done = assert.async();

  channel.start().then(function(/* resp */) {
    channel.connect();

    function onMembers () {
      var member = channel.get('members')[channel.member_id];
      if (member) {
        assert.equal(member, channel.nick);
        done();
      }
    }

    channel.addObserver('members', onMembers);
  });
});
